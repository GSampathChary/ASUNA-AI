from typing import Dict, Any

class AgentSecurityFilter:
    """Security filter ensuring Windows agent only executes authorized commands."""

    ALLOWED_ACTIONS = {
        "move_cursor",
        "click",
        "scroll",
        "type_text",
        "open_application",
        "take_screenshot",
        "get_system_info"
    }

    def validate_payload(self, payload: Dict[str, Any]) -> bool:
        action = payload.get("action")
        if action not in self.ALLOWED_ACTIONS:
            return False
        return True

agent_security = AgentSecurityFilter()
