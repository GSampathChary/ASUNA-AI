import time
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.gestures.landmarks.landmark_processor import ProcessedHandState


class DetectedGesture(BaseModel):
    gesture_name: str  # PINCH, INDEX_POINT, TWO_FINGER_UP, TWO_FINGER_DOWN, ZOOM_IN, ZOOM_OUT, OPEN_PALM, THUMBS_UP, THUMBS_DOWN, SWIPE_LEFT, SWIPE_RIGHT, FIST
    confidence: float
    dx: float = 0.0
    dy: float = 0.0
    timestamp: float


class GestureClassifier:
    """Classifies hand states into discrete system gestures with debouncing and threshold validation."""

    def __init__(self, pinch_threshold: float = 0.05, debounce_ms: float = 150):
        self.pinch_threshold = pinch_threshold
        self.debounce_ms = debounce_ms / 1000.0
        self._last_gesture_time: float = 0.0
        self._last_gesture_name: str = "NONE"

    def classify(self, hand_state: ProcessedHandState) -> Optional[DetectedGesture]:
        if not hand_state.is_detected:
            return None

        now = time.time()
        g_name = "NONE"
        confidence = 0.85
        dx, dy = 0.0, 0.0

        # 1. Pinch Gesture (Thumb & Index tip close)
        if hand_state.pinch_distance < self.pinch_threshold:
            g_name = "PINCH"
            confidence = min(0.98, 1.0 - (hand_state.pinch_distance / self.pinch_threshold) * 0.2)

        # 2. Velocity / Scroll Gestures (Two Finger / Index movement)
        elif abs(hand_state.velocity_y) > 2.0:
            if hand_state.velocity_y < -2.0:
                g_name = "TWO_FINGER_UP"
                dy = hand_state.velocity_y
            else:
                g_name = "TWO_FINGER_DOWN"
                dy = hand_state.velocity_y

        # 3. Horizontal Swipe Gestures
        elif abs(hand_state.velocity_x) > 2.5:
            if hand_state.velocity_x > 2.5:
                g_name = "SWIPE_RIGHT"
                dx = hand_state.velocity_x
            else:
                g_name = "SWIPE_LEFT"
                dx = hand_state.velocity_x

        # 4. Open Palm / Stop Gesture (hand span large and stationary)
        elif hand_state.hand_span > 0.35 and abs(hand_state.velocity_x) < 0.5:
            g_name = "OPEN_PALM"

        # 5. Default Index Pointing / Cursor Tracking
        else:
            g_name = "INDEX_POINT"

        # Debounce check
        if g_name != "INDEX_POINT" and g_name == self._last_gesture_name:
            if (now - self._last_gesture_time) < self.debounce_ms:
                return None  # Suppress duplicate jitter frame

        self._last_gesture_name = g_name
        self._last_gesture_time = now

        return DetectedGesture(
            gesture_name=g_name,
            confidence=confidence,
            dx=dx,
            dy=dy,
            timestamp=now
        )


gesture_classifier = GestureClassifier()
