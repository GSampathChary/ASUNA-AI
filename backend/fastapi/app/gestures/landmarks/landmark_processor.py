import math
import time
from typing import List, Dict, Tuple, Optional
from pydantic import BaseModel


class HandLandmark(BaseModel):
    id: int
    x: float
    y: float
    z: float = 0.0


class ProcessedHandState(BaseModel):
    is_detected: bool
    landmarks: List[HandLandmark]
    index_tip: HandLandmark
    thumb_tip: HandLandmark
    wrist: HandLandmark
    pinch_distance: float
    hand_span: float
    velocity_x: float
    velocity_y: float
    timestamp: float


class TemporalLandmarkSmoother:
    """Applies exponential moving average (EMA) smoothing to hand landmarks to prevent frame jitter."""

    def __init__(self, alpha: float = 0.4):
        self.alpha = alpha
        self._prev_landmarks: Dict[int, HandLandmark] = {}
        self._last_time: float = time.time()
        self._prev_index_x: float = 0.0
        self._prev_index_y: float = 0.0

    def process(self, raw_landmarks: List[Dict[str, float]]) -> ProcessedHandState:
        now = time.time()
        dt = max(now - self._last_time, 0.001)
        self._last_time = now

        smoothed: List[HandLandmark] = []
        for lm in raw_landmarks:
            lm_id = int(lm.get("id", len(smoothed)))
            x, y, z = lm.get("x", 0.0), lm.get("y", 0.0), lm.get("z", 0.0)

            if lm_id in self._prev_landmarks:
                prev = self._prev_landmarks[lm_id]
                sx = self.alpha * x + (1 - self.alpha) * prev.x
                sy = self.alpha * y + (1 - self.alpha) * prev.y
                sz = self.alpha * z + (1 - self.alpha) * prev.z
            else:
                sx, sy, sz = x, y, z

            smoothed_lm = HandLandmark(id=lm_id, x=sx, y=sy, z=sz)
            smoothed.append(smoothed_lm)
            self._prev_landmarks[lm_id] = smoothed_lm

        # Key landmark extraction (MediaPipe standard: 0=wrist, 4=thumb_tip, 8=index_tip)
        wrist = smoothed[0] if len(smoothed) > 0 else HandLandmark(id=0, x=0, y=0)
        thumb_tip = smoothed[4] if len(smoothed) > 4 else HandLandmark(id=4, x=0, y=0)
        index_tip = smoothed[8] if len(smoothed) > 8 else HandLandmark(id=8, x=0, y=0)

        # Pinch distance (thumb to index)
        pinch_dist = math.sqrt((thumb_tip.x - index_tip.x) ** 2 + (thumb_tip.y - index_tip.y) ** 2)

        # Hand span (wrist to middle finger tip #12)
        middle_tip = smoothed[12] if len(smoothed) > 12 else index_tip
        hand_span = math.sqrt((wrist.x - middle_tip.x) ** 2 + (wrist.y - middle_tip.y) ** 2)

        # Velocity calculation for index tip
        vx = (index_tip.x - self._prev_index_x) / dt
        vy = (index_tip.y - self._prev_index_y) / dt
        self._prev_index_x = index_tip.x
        self._prev_index_y = index_tip.y

        return ProcessedHandState(
            is_detected=len(smoothed) > 0,
            landmarks=smoothed,
            index_tip=index_tip,
            thumb_tip=thumb_tip,
            wrist=wrist,
            pinch_distance=pinch_dist,
            hand_span=hand_span,
            velocity_x=vx,
            velocity_y=vy,
            timestamp=now
        )


landmark_smoother = TemporalLandmarkSmoother()
