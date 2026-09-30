from typing import List, Optional, Dict, Any
from app.vision.screen.screen_analyzer import screen_analyzer, UICandidate


class TargetDetector:
    """Grounds finger pointing coordinates and voice descriptions into validated UI targets."""

    def resolve_target(
        self,
        pointer_x: Optional[int] = None,
        pointer_y: Optional[int] = None,
        voice_description: Optional[str] = None
    ) -> Optional[UICandidate]:
        candidates: List[UICandidate] = screen_analyzer.analyze_screen()

        # 1. Coordinate spatial matching
        if pointer_x is not None and pointer_y is not None:
            for c in candidates:
                bbox = c.bounding_box
                if (bbox["x"] <= pointer_x <= bbox["x"] + bbox["width"]) and \
                   (bbox["y"] <= pointer_y <= bbox["y"] + bbox["height"]):
                    return c

        # 2. Voice target semantic matching
        if voice_description:
            desc_lower = voice_description.lower()
            for c in candidates:
                if any(w in c.label.lower() for w in desc_lower.split()):
                    return c

        return candidates[0] if candidates else None


target_detector = TargetDetector()
