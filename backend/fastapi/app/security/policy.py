from enum import Enum, IntEnum
from typing import Dict, List, Set


class ActionLevel(IntEnum):
    LEVEL_1_SAFE = 1        # Safe read/view/navigation (e.g. open browser, scroll, play/pause)
    LEVEL_2_SENSITIVE = 2   # Sensitive actions (e.g. send message, upload file, share image)
    LEVEL_3_HIGH_RISK = 3   # High-risk actions (e.g. delete file, modify security, financial, system shutdown)


class PolicyStatus(str, Enum):
    ALLOWED = "ALLOWED"
    DENIED = "DENIED"
    CONFIRMATION_REQUIRED = "CONFIRMATION_REQUIRED"


class SecurityPolicy:
    """Defines baseline permission levels for standard tool categories and specific actions."""

    # Default action categorization
    ACTION_LEVELS: Dict[str, ActionLevel] = {
        # Browser & UI (Safe Level 1)
        "open_browser": ActionLevel.LEVEL_1_SAFE,
        "scroll_page": ActionLevel.LEVEL_1_SAFE,
        "zoom_page": ActionLevel.LEVEL_1_SAFE,
        "click_element": ActionLevel.LEVEL_1_SAFE,
        "media_control": ActionLevel.LEVEL_1_SAFE,

        # Communication & Sharing (Sensitive Level 2)
        "send_message": ActionLevel.LEVEL_2_SENSITIVE,
        "upload_file": ActionLevel.LEVEL_2_SENSITIVE,
        "share_image": ActionLevel.LEVEL_2_SENSITIVE,
        "take_screenshot": ActionLevel.LEVEL_2_SENSITIVE,

        # System & File Modification (High Risk Level 3)
        "delete_file": ActionLevel.LEVEL_3_HIGH_RISK,
        "write_file": ActionLevel.LEVEL_3_HIGH_RISK,
        "modify_security": ActionLevel.LEVEL_3_HIGH_RISK,
        "system_command": ActionLevel.LEVEL_3_HIGH_RISK,
        "financial_transaction": ActionLevel.LEVEL_3_HIGH_RISK,
    }

    @classmethod
    def get_action_level(cls, action_name: str) -> ActionLevel:
        return cls.ACTION_LEVELS.get(action_name, ActionLevel.LEVEL_2_SENSITIVE)
