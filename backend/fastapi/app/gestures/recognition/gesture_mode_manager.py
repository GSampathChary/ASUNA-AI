from enum import Enum


class GestureMode(str, Enum):
    NORMAL_MODE = "NORMAL_MODE"
    GESTURE_MODE = "GESTURE_MODE"
    CAMERA_MODE = "CAMERA_MODE"
    PAUSED_MODE = "PAUSED_MODE"


class GestureModeManager:
    """Controls gesture recognition state. Prevents ordinary hand movements from causing unintended computer actions when gesture mode is off."""

    def __init__(self, initial_mode: GestureMode = GestureMode.NORMAL_MODE):
        self._current_mode = initial_mode

    @property
    def current_mode(self) -> GestureMode:
        return self._current_mode

    def set_mode(self, mode: GestureMode):
        self._current_mode = mode

    def is_active(self) -> bool:
        return self._current_mode in [GestureMode.GESTURE_MODE, GestureMode.CAMERA_MODE]


gesture_mode_manager = GestureModeManager()
