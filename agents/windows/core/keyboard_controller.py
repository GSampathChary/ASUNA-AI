import ctypes
import time

class KeyboardController:
    """Simulates Windows keyboard key presses and text typing."""

    def __init__(self):
        self.user32 = ctypes.windll.user32

    def type_text(self, text: str):
        """Types string text character by character."""
        for char in text:
            vk = self.user32.VkKeyScanW(ord(char))
            if vk != -1:
                self.user32.keybd_event(vk & 0xFF, 0, 0, 0)
                time.sleep(0.01)
                self.user32.keybd_event(vk & 0xFF, 0, 2, 0)  # KEYEVENTF_KEYUP

    def press_hotkey(self, modifier_vk: int, key_vk: int):
        """Execute a modifier key combination (e.g., Ctrl+C)."""
        self.user32.keybd_event(modifier_vk, 0, 0, 0)
        self.user32.keybd_event(key_vk, 0, 0, 0)
        time.sleep(0.02)
        self.user32.keybd_event(key_vk, 0, 2, 0)
        self.user32.keybd_event(modifier_vk, 0, 2, 0)


keyboard_controller = KeyboardController()
