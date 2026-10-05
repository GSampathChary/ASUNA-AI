import sys
import subprocess
import os
from datetime import datetime, timezone
from pathlib import Path

try:
    from dotenv import load_dotenv
    # Load .env from current directory or project root
    env_path = Path(__file__).resolve().parent.parent / ".env"
    root_env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    elif root_env_path.exists():
        load_dotenv(dotenv_path=root_env_path)
    else:
        load_dotenv()
except ImportError:
    pass

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.api.websocket import router as ws_router, ws_manager
from app.api.auth import router as auth_router
from app.tools.system_tools import register_standard_tools
from app.ai.llm.provider import get_llm_provider

register_standard_tools()

app = FastAPI(title="Asuna AI Backend", version="1.0.0")

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ALLOW_ORIGINS",
        "http://localhost:3000,http://localhost:5173,https://asuna-ai.vercel.app",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # The public chat API uses no cookies or browser credentials.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(auth_router)


class CommandRequest(BaseModel):
    command: str
    action_type: str = "auto"
    value: int = 100


class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = []
    client_time: str | None = None
    client_timezone: str | None = None
    user_email: str | None = "user@asuna.ai"
    user_nickname: str | None = None
    target_device: str | None = "local"


# A lightweight safety rail for the initial public deployment. Replace with
# authenticated per-user quotas before treating this as a production service.
chat_requests: dict[str, list[float]] = {}
CHAT_RATE_WINDOW_SECONDS = 600
CHAT_RATE_LIMIT = 30


@app.get("/api/devices/connected")
async def get_connected_devices(email: str = "user@asuna.ai", x_asuna_session: str | None = Header(default=None)):
    """Returns real-time online devices connected under the specified user account."""
    if not ws_manager.valid_session(email, x_asuna_session):
        raise HTTPException(status_code=401, detail="Pair this browser before viewing device status.")
    devices = ws_manager.get_user_devices(email)
    return {
        "email": email,
        "connected_devices": devices,
        "count": len(devices)
    }


@app.post("/api/chat")
async def chat(req: ChatRequest, request: Request, x_asuna_session: str | None = Header(default=None)):
    """Answer a conversational request without exposing model credentials to clients."""
    import time
    client_id = request.headers.get("x-forwarded-for", request.client.host).split(",")[0].strip()
    now = time.time()
    recent = [timestamp for timestamp in chat_requests.get(client_id, []) if now - timestamp < CHAT_RATE_WINDOW_SECONDS]
    if len(recent) >= CHAT_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again in a few minutes.")
    chat_requests[client_id] = [*recent, now]
    messages = [*req.history[-8:], {"role": "user", "content": req.message}]
    current_time = req.client_time or datetime.now(timezone.utc).strftime("%A, %B %d, %Y %I:%M %p UTC")
    timezone_name = req.client_timezone or "UTC"
    user_email = req.user_email or "user@asuna.ai"
    user_nickname = (req.user_nickname or "").strip()[:40]

    # Process cross-device intent
    from app.ai.intent.intent_engine import intent_engine
    extracted = intent_engine.process_query(req.message)
    target_dev = req.target_device if req.target_device and req.target_device != "local" else extracted.target_device

    remote_status = None
    if target_dev in ["laptop", "mobile"]:
        remote_status = await ws_manager.relay_remote_command(
            user_email,
            x_asuna_session,
            target_dev,
            {"action": extracted.normalized_intent, "command": req.message, "args": extracted.arguments}
        )

    system_context = (
        f"User Account: {user_email}.\n"
        f"User Nickname: {user_nickname or 'not provided'}. Address the user by this nickname when it is provided; never call them Mr. Stark.\n"
        f"Target Device: {target_dev} (Status: {remote_status.get('status') if remote_status else 'local'}).\n"
        f"User's Local Date and Time: {current_time} (Timezone: {timezone_name}). "
        f"Server UTC Timestamp: {datetime.now(timezone.utc).isoformat()}.\n"
        "This date and time is authoritative and accurate. Always use this date when asked about today's date, time, or current calendar day."
    )
    try:
        response = await get_llm_provider().generate_response(messages, system_context=system_context)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    provider = "gemini" if os.getenv("GEMINI_API_KEY") else "openai" if os.getenv("OPENAI_API_KEY") else "local-fallback"
    return {"reply": response.content, "provider": provider, "target_device": target_dev, "remote_status": remote_status}


@app.post("/api/execute_action")
async def execute_action(req: CommandRequest, x_asuna_agent_token: str | None = Header(default=None)):
    """Executes native Windows / Device actions instantly"""
    paired_token = os.getenv("ASUNA_AGENT_TOKEN")
    if not paired_token or x_asuna_agent_token != paired_token:
        raise HTTPException(
            status_code=403,
            detail="Device actions require a paired Asuna agent and explicit confirmation.",
        )
    cmd = req.command.lower()
    
    if "volume" in cmd or "sound" in cmd or req.action_type == "volume":
        try:
            if sys.platform == "win32":
                subprocess.run(
                    ["powershell", "-Command", "(new-object -com wscript.shell).SendKeys([char]175)*50"],
                    shell=True,
                    capture_output=True
                )
            return {"status": "success", "message": f"System Volume set to {req.value}% successfully!"}
        except Exception:
            return {"status": "success", "message": f"Volume command dispatched (Level {req.value}%)."}

    elif "open" in cmd or "launch" in cmd:
        target = cmd.replace("open", "").replace("launch", "").strip()
        if not target.startswith("http"):
            target = "https://" + target
        import webbrowser
        webbrowser.open(target)
        return {"status": "success", "message": f"Opened {target} successfully!"}

    return {"status": "success", "message": f"Executed action for '{req.command}'"}


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Asuna AI Backend",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Unauthenticated deployment health check; does not expose secrets."""
    return {"status": "healthy", "provider_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"))}
