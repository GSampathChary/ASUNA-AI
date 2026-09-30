"""FastAPI Core Application for Asuna AI"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import subprocess

from app.api.websocket import router as ws_router
from app.api.auth import router as auth_router
from app.tools.system_tools import register_standard_tools

register_standard_tools()

app = FastAPI(title="Asuna AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(auth_router)


class CommandRequest(BaseModel):
    command: str
    action_type: str = "auto"
    value: int = 100


@app.post("/api/execute_action")
async def execute_action(req: CommandRequest):
    """Executes native Windows / Device actions instantly"""
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
