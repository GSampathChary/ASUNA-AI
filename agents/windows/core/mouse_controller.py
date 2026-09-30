import ctypes
import time
from typing import Tuple

class MouseController:
    """Controls mouse movement, cursor position mapping, clicks, and scroll on Windows OS."""

    def __init__(self):
        self.user32 = ctypes.windll.user32
        self.screen_width = self.user32.GetSystemMetrics(0)
        self.screen_height = self.user32.GetSystemMetrics(1)

    def move_cursor(self, norm_x: float, norm_y: float):
        """Move cursor to normalized coordinates (0.0 to 1.0)."""
        target_x = int(norm_x * self.screen_width)
        target_y = int(norm_y * self.screen_height)
        self.user32.SetCursorPos(target_x, target_y)

    def click(self, button: str = "left"):
        """Execute mouse click at current position."""
        if button == "left":
            self.user32.mouse_event(0x0002, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTDOWN
            time.sleep(0.02)
            self.user32.mouse_event(0x0004, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTUP
        elif button == "right":
            self.user32.mouse_event(0x0008, 0, 0, 0, 0)  # MOUSEEVENTF_RIGHTDOWN
            time.sleep(0.02)
            self.user32.mouse_event(0x0010, 0, 0, 0, 0)  # MOUSEEVENTF_RIGHTUP

    def scroll(self, amount: int):
        """Scroll vertical wheel (positive = up, negative = down)."""
        self.user32.mouse_event(0x0800, 0, 0, amount, 0)  # MOUSEEVENTF_WHEEL


mouse_controller = MouseController()
