import time
from enum import Enum


class VoiceSessionState(str, Enum):
    IDLE = "IDLE"
    LISTENING = "LISTENING"
    PROCESSING = "PROCESSING"
    SPEAKING = "SPEAKING"
    INTERRUPTED = "INTERRUPTED"
    MUTED = "MUTED"


class VoiceSessionController:
    """Manages active continuous voice sessions, allowing multi-turn conversations and speech interruptions."""

    def __init__(self, session_timeout_s: float = 60.0):
        self.session_timeout_s = session_timeout_s
        self.state = VoiceSessionState.IDLE
        self._last_active_time = time.time()

    def start_session(self):
        self.state = VoiceSessionState.LISTENING
        self._last_active_time = time.time()

    def interrupt(self):
        if self.state == VoiceSessionState.SPEAKING:
            self.state = VoiceSessionState.INTERRUPTED
            self.state = VoiceSessionState.LISTENING

    def set_speaking(self):
        self.state = VoiceSessionState.SPEAKING
        self._last_active_time = time.time()

    def set_listening(self):
        self.state = VoiceSessionState.LISTENING
        self._last_active_time = time.time()

    def check_timeout(self) -> bool:
        if self.state != VoiceSessionState.IDLE and (time.time() - self._last_active_time) > self.session_timeout_s:
            self.state = VoiceSessionState.IDLE
            return True
        return False


voice_session_controller = VoiceSessionController()
