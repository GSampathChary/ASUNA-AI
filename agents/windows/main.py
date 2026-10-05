import json
import asyncio
import logging
from agents.windows.core.mouse_controller import mouse_controller
from agents.windows.core.keyboard_controller import keyboard_controller
from agents.windows.security.agent_security import agent_security

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("asuna.windows_agent")

import os
import sys
import subprocess
import webbrowser

BACKEND_WS_URL = os.getenv("ASUNA_WS_URL", "ws://localhost:8000/ws")
USER_EMAIL = os.getenv("ASUNA_USER_EMAIL", "user@asuna.ai")
DEVICE_ID = os.getenv("ASUNA_DEVICE_ID", "windows_laptop_1")
PAIRING_TOKEN = os.getenv("ASUNA_AGENT_TOKEN", "")


def set_system_volume(level: int) -> None:
    """Set the master Windows volume precisely when pycaw is installed."""
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
    from comtypes import CLSCTX_ALL
    devices = AudioUtilities.GetSpeakers()
    interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    volume = interface.QueryInterface(IAudioEndpointVolume)
    volume.SetMasterVolumeLevelScalar(max(0, min(100, level)) / 100, None)

async def run_windows_agent():
    if not PAIRING_TOKEN:
        raise RuntimeError("ASUNA_AGENT_TOKEN must be set before starting the Windows agent.")
    logger.info(f"Initializing JARVIS Windows Agent for account {USER_EMAIL}...")
    try:
        import websockets
        async with websockets.connect(BACKEND_WS_URL) as ws:
            logger.info(f"Connected to JARVIS Gateway at {BACKEND_WS_URL}")

            # Register Windows Agent session under account email
            await ws.send(json.dumps({
                "type": "agent_register",
                "email": USER_EMAIL,
                "device_type": "laptop",
                "device_id": DEVICE_ID,
                "pairing_token": PAIRING_TOKEN,
            }))

            while True:
                msg_str = await ws.recv()
                payload = json.loads(msg_str)
                msg_type = payload.get("type")

                if msg_type == "remote_action":
                    action = payload.get("action", "")
                    cmd = payload.get("command", "").lower()
                    args = payload.get("args", {})
                    if not agent_security.validate_payload(payload):
                        logger.warning("Rejected disallowed remote action: %s", action)
                        continue
                    logger.info(f"Received remote command: {cmd} (action: {action})")

                    if "youtube" in cmd or "open_application" in action and "youtube" in str(args).lower():
                        webbrowser.open("https://www.youtube.com")
                    elif "chrome" in cmd or "browser" in cmd or action == "open_browser":
                        url = args.get("url", "https://www.google.com")
                        webbrowser.open(url if url.startswith("http") else f"https://{url}")
                    elif action == "set_volume":
                        if sys.platform != "win32":
                            logger.warning("Exact volume setting is only available on Windows.")
                            continue
                        try:
                            set_system_volume(int(args.get("level", 50)))
                        except ImportError:
                            logger.error("Install pycaw and comtypes to enable exact volume control.")
                    elif "volume" in cmd or action in ["volume_up", "volume_down"]:
                        if sys.platform == "win32":
                            subprocess.run(
                                ["powershell", "-Command", "(new-object -com wscript.shell).SendKeys([char]175)*20"],
                                shell=True, capture_output=True
                            )
                    elif action == "move_cursor":
                        mouse_controller.move_cursor(args.get("x", 0.5), args.get("y", 0.5))
                    elif action == "click":
                        mouse_controller.click(args.get("button", "left"))
                    elif action == "type_text":
                        keyboard_controller.type_text(args.get("text", ""))


    except Exception as ex:
        logger.info(f"Windows Agent standby mode (Backend connection): {ex}")

if __name__ == "__main__":
    asyncio.run(run_windows_agent())
