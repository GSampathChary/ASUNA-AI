import json
import logging
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.asuna_state import asuna_state_machine, AsunaState
from app.gestures.landmarks.landmark_processor import landmark_smoother
from app.gestures.classifier import gesture_classifier
from app.gestures.recognition.gesture_mode_manager import gesture_mode_manager
from app.ai.planner.agent_planner import agent_planner

logger = logging.getLogger("asuna.websocket")
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = ConnectionManager()

# Synchronize State Machine with WebSocket Clients
def _on_state_change(old_state: AsunaState, new_state: AsunaState):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(ws_manager.broadcast({
                "type": "asuna_state",
                "old_state": old_state.value,
                "state": new_state.value
            }))
    except Exception:
        pass

asuna_state_machine.subscribe(_on_state_change)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to Asuna AI Real-Time Gateway",
            "asuna_state": asuna_state_machine.current_state.value
        })

        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                msg_type = msg.get("type")

                # 1. Gesture Landmarks Telemetry
                if msg_type == "gesture_landmarks":
                    landmarks = msg.get("landmarks", [])
                    hand_state = landmark_smoother.process(landmarks)
                    detected = gesture_classifier.classify(hand_state)

                    if detected and gesture_mode_manager.is_active():
                        # Update visual core state based on gesture
                        if detected.gesture_name == "PINCH":
                            asuna_state_machine.set_state(AsunaState.CLICKING)
                        elif detected.gesture_name in ["TWO_FINGER_UP", "TWO_FINGER_DOWN"]:
                            asuna_state_machine.set_state(AsunaState.SCROLLING)

                        await websocket.send_json({
                            "type": "gesture_event",
                            "gesture": detected.gesture_name,
                            "confidence": detected.confidence,
                            "dx": detected.dx,
                            "dy": detected.dy
                        })

                # 2. Voice Text Query / Multi-step Command
                elif msg_type == "voice_command":
                    text_query = msg.get("query", "")
                    asuna_state_machine.set_state(AsunaState.THINKING)

                    # Create and execute agent plan
                    plan = agent_planner.create_plan(text_query)
                    executed_plan = await agent_planner.execute_next_step(plan)

                    asuna_state_machine.set_state(AsunaState.SPEAKING)
                    await websocket.send_json({
                        "type": "command_result",
                        "user_query": text_query,
                        "plan": executed_plan.dict()
                    })

                # 3. Asuna State Override
                elif msg_type == "set_state":
                    target_state = msg.get("state")
                    if target_state in AsunaState.__members__:
                        asuna_state_machine.set_state(AsunaState[target_state])

            except Exception as ex:
                logger.error(f"Error parsing WebSocket payload: {ex}")
                await websocket.send_json({"type": "error", "message": str(ex)})

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
