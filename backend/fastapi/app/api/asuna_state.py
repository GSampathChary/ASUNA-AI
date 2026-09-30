from enum import Enum
from typing import List, Callable


class AsunaState(str, Enum):
    IDLE = "IDLE"
    LISTENING = "LISTENING"
    PROCESSING = "PROCESSING"
    THINKING = "THINKING"
    SPEAKING = "SPEAKING"
    GESTURE_ACTIVE = "GESTURE_ACTIVE"
    TARGETING = "TARGETING"
    CLICKING = "CLICKING"
    SCROLLING = "SCROLLING"
    ZOOMING_IN = "ZOOMING_IN"
    ZOOMING_OUT = "ZOOMING_OUT"
    CONFIRMING = "CONFIRMING"
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"
    PAUSED = "PAUSED"
    OFFLINE = "OFFLINE"


class AsunaStateMachine:
    """Centralized state machine notifying 3D visual engines and clients of state transitions."""

    def __init__(self, initial_state: AsunaState = AsunaState.IDLE):
        self._state = initial_state
        self._listeners: List[Callable[[AsunaState, AsunaState], None]] = []

    @property
    def current_state(self) -> AsunaState:
        return self._state

    def set_state(self, new_state: AsunaState):
        if new_state != self._state:
            old_state = self._state
            self._state = new_state
            for cb in self._listeners:
                try:
                    cb(old_state, new_state)
                except Exception:
                    pass

    def subscribe(self, callback: Callable[[AsunaState, AsunaState], None]):
        self._listeners.append(callback)


asuna_state_machine = AsunaStateMachine()
