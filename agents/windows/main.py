import json
import asyncio
import logging
from agents.windows.core.mouse_controller import mouse_controller
from agents.windows.core.keyboard_controller import keyboard_controller
from agents.windows.security.agent_security import agent_security

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("asuna.windows_agent")

BACKEND_WS_URL = "ws://localhost:8000/ws"

async def run_windows_agent():
    logger.info("Initializing Asuna Windows Agent...")
    try:
        import websockets
        async with websockets.connect(BACKEND_WS_URL) as ws:
            logger.info(f"Connected to Asuna Backend at {BACKEND_WS_URL}")

            # Register Windows Agent session
            await ws.send(json.dumps({"type": "agent_register", "agent_type": "windows"}))

            while True:
                msg_str = await ws.recv()
                payload = json.loads(msg_str)

                if not agent_security.validate_payload(payload):
                    logger.warning(f"Rejected unauthorized payload: {payload}")
                    continue

                action = payload.get("action")
                args = payload.get("args", {})

                if action == "move_cursor":
                    mouse_controller.move_cursor(args.get("x", 0.5), args.get("y", 0.5))
                elif action == "click":
                    mouse_controller.click(args.get("button", "left"))
                elif action == "scroll":
                    mouse_controller.scroll(args.get("amount", 120))
                elif action == "type_text":
                    keyboard_controller.type_text(args.get("text", ""))

    except Exception as ex:
        logger.info(f"Windows Agent loop standby mode (Backend connection): {ex}")

if __name__ == "__main__":
    asyncio.run(run_windows_agent())
