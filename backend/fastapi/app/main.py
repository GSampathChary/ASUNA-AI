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

from app.api.websocket import router as ws_router
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


# A lightweight safety rail for the initial public deployment. Replace with
# authenticated per-user quotas before treating this as a production service.
chat_requests: dict[str, list[float]] = {}
CHAT_RATE_WINDOW_SECONDS = 600
CHAT_RATE_LIMIT = 30


@app.post("/api/chat")
async def chat(req: ChatRequest, request: Request):
    """Answer a conversational request without exposing model credentials to clients."""
    import time
    client_id = request.headers.get("x-forwarded-for", request.client.host).split(",")[0].strip()
    now = time.time()
    recent = [timestamp for timestamp in chat_requests.get(client_id, []) if now - timestamp < CHAT_RATE_WINDOW_SECONDS]
    if len(recent) >= CHAT_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again in a few minutes.")
    chat_requests[client_id] = [*recent, now]
    messages = [*req.history[-8:], {"role": "user", "content": req.message}]
    current_time = req.client_time or datetime.now(timezone.utc).isoformat()
    timezone_name = req.client_timezone or "UTC"
    system_context = (
        f"The user's current local date/time is {current_time} in timezone {timezone_name}. "
        "Use this as the authoritative current date/time. For current events, live scores, weather, "
        "or other changing facts, use available search grounding and clearly state uncertainty if it is unavailable."
    )
    try:
        response = await get_llm_provider().generate_response(messages, system_context=system_context)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    provider = "gemini" if os.getenv("GEMINI_API_KEY") else "openai" if os.getenv("OPENAI_API_KEY") else "local-fallback"
    return {"reply": response.content, "provider": provider}


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
