from typing import Dict, Any, Tuple
from app.security.policy import ActionLevel, SecurityPolicy, PolicyStatus
from app.security.permission_manager import permission_manager
from app.security.confirmation import confirmation_manager, ConfirmationRequest


class ActionValidator:
    """Validates requested actions against policy, permissions, and required confirmations."""

    def validate_action(
        self,
        action_name: str,
        arguments: Dict[str, Any],
        target_resource: str = None
    ) -> Tuple[PolicyStatus, str, ConfirmationRequest | None]:
        level = SecurityPolicy.get_action_level(action_name)

        # Level 1: Safe actions execute directly
        if level == ActionLevel.LEVEL_1_SAFE:
            return PolicyStatus.ALLOWED, "Level 1 action approved automatically", None

        # Level 2 & 3: Check permission manager or require confirmation
        if level == ActionLevel.LEVEL_2_SENSITIVE:
            if permission_manager.is_permission_granted(action_name):
                return PolicyStatus.ALLOWED, "Level 2 action granted by session permissions", None
            # Requires confirmation
            req = confirmation_manager.create_request(action_name, arguments, level, target_resource)
            return PolicyStatus.CONFIRMATION_REQUIRED, f"Level 2 action '{action_name}' requires user confirmation", req

        # Level 3: High risk - always require confirmation
        req = confirmation_manager.create_request(action_name, arguments, level, target_resource)
        return PolicyStatus.CONFIRMATION_REQUIRED, f"Level 3 high-risk action '{action_name}' requires explicit confirmation", req


action_validator = ActionValidator()
