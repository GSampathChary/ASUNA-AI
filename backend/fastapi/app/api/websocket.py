import json
import logging
import os
import secrets
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.asuna_state import asuna_state_machine, AsunaState
from app.gestures.landmarks.landmark_processor import landmark_smoother
from app.gestures.classifier import gesture_classifier
from app.gestures.recognition.gesture_mode_manager import gesture_mode_manager
from app.ai.planner.agent_planner import agent_planner

logger = logging.getLogger("asuna.websocket")
router = APIRouter()
REMOTE_ACTIONS = {
    "open_application", "open_browser", "toggle_flashlight", "set_volume",
    "volume_up", "volume_down", "media_pause", "media_play",
}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_meta: dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        self.connection_meta[websocket] = {
            "email": None,
            "device_type": None,
            "device_id": None,
            "session_token": None,
            "verified": False,
        }

    def disconnect(self, websocket: WebSocket):
        meta = self.connection_meta.pop(websocket, None)
        self.active_connections.discard(websocket)
        if meta and meta.get("verified"):
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(self.broadcast_device_status(meta["email"]))
            except Exception:
                pass

    def register_device(self, websocket: WebSocket, email: str, device_type: str, device_id: str, pairing_token: str) -> dict:
        """Pair a device with the server-held secret; email alone is never trust."""
        expected_token = os.getenv("ASUNA_AGENT_TOKEN")
        if not expected_token:
            raise ValueError("ASUNA_AGENT_TOKEN is not configured on the server.")
        if not secrets.compare_digest(pairing_token or "", expected_token):
            raise PermissionError("Invalid pairing token.")
        if device_type not in {"browser", "laptop", "mobile"}:
            raise ValueError("Unsupported device type.")
        if not email or "@" not in email:
            raise ValueError("A valid account email is required.")
        meta = {
            "email": email.strip().lower(),
            "device_type": device_type,
            "device_id": (device_id or f"{device_type}_device")[:128],
            "session_token": secrets.token_urlsafe(32),
            "verified": True,
        }
        self.connection_meta[websocket] = meta
        return meta

    def valid_session(self, email: str, session_token: str | None) -> bool:
        return any(
            meta["verified"]
            and meta["email"] == email.strip().lower()
            and secrets.compare_digest(meta["session_token"] or "", session_token or "")
            for meta in self.connection_meta.values()
        )

    def get_user_devices(self, email: str) -> list[dict]:
        user_email = email.strip().lower()
        devices = []
        for meta in self.connection_meta.values():
            if meta["verified"] and meta["email"] == user_email:
                devices.append({
                    "device_type": meta["device_type"],
                    "device_id": meta["device_id"],
                    "status": "online"
                })
        return devices

    async def relay_remote_command(self, sender_email: str, sender_session: str | None, target_device_type: str, action_payload: dict) -> dict:
        user_email = sender_email.strip().lower()
        target_type = target_device_type.strip().lower()
        if target_type not in {"laptop", "mobile", "all"}:
            return {"status": "rejected", "message": "Unsupported target device."}
        if not self.valid_session(user_email, sender_session):
            return {"status": "unauthorized", "message": "Pair this device before sending remote commands."}
        if action_payload.get("action") not in REMOTE_ACTIONS:
            return {"status": "rejected", "message": "That remote action is not permitted."}
        delivered = False

        for ws, meta in list(self.connection_meta.items()):
            if meta["verified"] and meta["email"] == user_email and (target_type in ["all", meta["device_type"]] or target_type in meta["device_id"]):
                try:
                    await ws.send_json({
                        "type": "remote_action",
                        "sender_email": sender_email,
                        "action": action_payload.get("action"),
                        "args": action_payload.get("args", {}),
                        "command": action_payload.get("command", "")
                    })
                    delivered = True
                except Exception:
                    self.disconnect(ws)

        if delivered:
            return {"status": "success", "message": f"Dispatched action to {target_device_type} successfully."}
        return {"status": "offline", "message": f"Target device '{target_device_type}' is not connected on account {sender_email}."}

    async def broadcast_device_status(self, email: str):
        if not email:
            return
        devices = self.get_user_devices(email)
        user_email = email.strip().lower()
        for ws, meta in list(self.connection_meta.items()):
            if meta["verified"] and meta["email"] == user_email:
                try:
                    await ws.send_json({
                        "type": "device_network_update",
                        "email": user_email,
                        "connected_devices": devices
                    })
                except Exception:
                    self.disconnect(ws)

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
            "message": "Connected to Asuna Neural Gateway",
            "asuna_state": asuna_state_machine.current_state.value
        })

        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                msg_type = msg.get("type")

                # 1. Device Registration (e.g. Laptop Agent, Mobile Agent)
                if msg_type == "agent_register":
                    email = msg.get("email", "user@asuna.ai")
                    device_type = msg.get("device_type", msg.get("agent_type", "laptop"))
                    device_id = msg.get("device_id", f"{device_type}_agent")
                    meta = ws_manager.register_device(websocket, email, device_type, device_id, msg.get("pairing_token", ""))
                    await ws_manager.broadcast_device_status(email)
                    await websocket.send_json({
                        "type": "registered",
                        "status": "active",
                        "device_type": device_type,
                        "email": email,
                        "session_token": meta["session_token"],
                    })

                # 2. Remote Command Dispatch (Device A -> Device B)
                elif msg_type == "remote_command":
                    sender_email = msg.get("email", "user@asuna.ai")
                    sender_session = msg.get("session_token")
                    target_device = msg.get("target_device", "laptop")
                    action_payload = msg.get("payload", {})
                    res = await ws_manager.relay_remote_command(sender_email, sender_session, target_device, action_payload)
                    await websocket.send_json({"type": "remote_dispatch_result", **res})

                # 3. Gesture Landmarks Telemetry
                elif msg_type == "gesture_landmarks":
                    landmarks = msg.get("landmarks", [])
                    hand_state = landmark_smoother.process(landmarks)
                    detected = gesture_classifier.classify(hand_state)

                    if detected and gesture_mode_manager.is_active():
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

                # 4. Voice / Text Command
                elif msg_type == "voice_command":
                    text_query = msg.get("query", "")
                    sender_email = msg.get("email", "user@asuna.ai")
                    sender_session = msg.get("session_token")
                    asuna_state_machine.set_state(AsunaState.THINKING)

                    # Create and execute agent plan
                    plan = agent_planner.create_plan(text_query)
                    executed_plan = await agent_planner.execute_next_step(plan)

                    # Check if intent target is remote
                    from app.ai.intent.intent_engine import intent_engine
                    extracted = intent_engine.process_query(text_query)
                    if extracted.target_device in ["laptop", "mobile"]:
                        remote_res = await ws_manager.relay_remote_command(
                            sender_email,
                            sender_session,
                            extracted.target_device,
                            {"action": extracted.normalized_intent, "command": text_query, "args": extracted.arguments}
                        )

                    asuna_state_machine.set_state(AsunaState.SPEAKING)
                    await websocket.send_json({
                        "type": "command_result",
                        "user_query": text_query,
                        "plan": executed_plan.dict(),
                        "target_device": extracted.target_device
                    })

                # 5. Asuna State Override
                elif msg_type == "set_state":
                    target_state = msg.get("state")
                    if target_state in AsunaState.__members__:
                        asuna_state_machine.set_state(AsunaState[target_state])

            except Exception as ex:
                logger.error(f"Error parsing WebSocket payload: {ex}")
                await websocket.send_json({"type": "error", "message": str(ex)})

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
