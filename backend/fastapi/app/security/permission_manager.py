from typing import Dict, Set
from app.security.policy import ActionLevel, SecurityPolicy


class PermissionManager:
    """Manages active user permissions and grants."""

    def __init__(self):
        # Default granted permissions per session/user
        self._granted_permissions: Set[str] = {
            "open_browser",
            "scroll_page",
            "zoom_page",
            "click_element",
            "media_control",
        }

    def is_permission_granted(self, action_name: str) -> bool:
        """Check if an action's permission is currently granted."""
        level = SecurityPolicy.get_action_level(action_name)
        if level == ActionLevel.LEVEL_1_SAFE:
            return True
        return action_name in self._granted_permissions

    def grant_permission(self, action_name: str):
        self._granted_permissions.add(action_name)

    def revoke_permission(self, action_name: str):
        self._granted_permissions.discard(action_name)


permission_manager = PermissionManager()
