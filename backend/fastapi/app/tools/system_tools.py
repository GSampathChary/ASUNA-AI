from typing import Dict, Any
from app.tools.registry import tool_registry


# Browser Tools
async def open_browser_tool(url: str = "https://google.com") -> Dict[str, Any]:
    return {"action": "open_browser", "url": url, "status": "dispatched"}

async def scroll_page_tool(direction: str = "down", amount: int = 300) -> Dict[str, Any]:
    return {"action": "scroll_page", "direction": direction, "amount": amount, "status": "dispatched"}

async def zoom_page_tool(mode: str = "in", factor: float = 1.2) -> Dict[str, Any]:
    return {"action": "zoom_page", "mode": mode, "factor": factor, "status": "dispatched"}

async def click_element_tool(x: int = 0, y: int = 0, target_name: str = None) -> Dict[str, Any]:
    return {"action": "click_element", "x": x, "y": y, "target_name": target_name, "status": "dispatched"}

# Communication & Media Tools
async def send_message_tool(recipient: str, message: str, platform: str = "whatsapp") -> Dict[str, Any]:
    return {"action": "send_message", "recipient": recipient, "platform": platform, "message": message, "status": "queued"}

async def media_control_tool(command: str = "play") -> Dict[str, Any]:  # play, pause, next, prev, volume_up, volume_down
    return {"action": "media_control", "command": command, "status": "executed"}

# File & OS System Tools
async def delete_file_tool(file_path: str) -> Dict[str, Any]:
    return {"action": "delete_file", "file_path": file_path, "status": "deleted"}

async def open_app_tool(application: str) -> Dict[str, Any]:
    return {"action": "open_app", "application": application, "status": "launched"}


def register_standard_tools():
    tool_registry.register(
        name="open_browser",
        description="Open web browser or navigate to a given URL",
        category="BROWSER",
        input_schema={"url": "string"},
        handler=open_browser_tool
    )
    tool_registry.register(
        name="scroll_page",
        description="Scroll page content up or down",
        category="BROWSER",
        input_schema={"direction": "string", "amount": "integer"},
        handler=scroll_page_tool
    )
    tool_registry.register(
        name="zoom_page",
        description="Zoom page content in or out",
        category="BROWSER",
        input_schema={"mode": "string", "factor": "number"},
        handler=zoom_page_tool
    )
    tool_registry.register(
        name="click_element",
        description="Click at specific screen coordinates or UI target element",
        category="BROWSER",
        input_schema={"x": "integer", "y": "integer", "target_name": "string"},
        handler=click_element_tool
    )
    tool_registry.register(
        name="send_message",
        description="Send a message to a recipient via WhatsApp or Messaging",
        category="COMMUNICATION",
        input_schema={"recipient": "string", "message": "string", "platform": "string"},
        handler=send_message_tool
    )
    tool_registry.register(
        name="media_control",
        description="Control playback and volume (play, pause, next, volume_up, volume_down)",
        category="MEDIA",
        input_schema={"command": "string"},
        handler=media_control_tool
    )
    tool_registry.register(
        name="delete_file",
        description="Delete a file at target path (High-Risk Level 3)",
        category="FILES",
        input_schema={"file_path": "string"},
        handler=delete_file_tool
    )
    tool_registry.register(
        name="open_app",
        description="Launch a desktop or mobile application",
        category="SYSTEM",
        input_schema={"application": "string"},
        handler=open_app_tool
    )


# Automatically register on import
register_standard_tools()
