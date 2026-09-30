from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class UICandidate(BaseModel):
    id: str
    label: str  # e.g., "blue button", "WhatsApp icon", "search bar", "image photo"
    element_type: str  # button, image, input, link, icon
    bounding_box: Dict[str, int]  # x, y, width, height
    confidence: float


class ScreenAnalyzer:
    """Parses screen captures, performs OCR, and identifies interactive UI target elements."""

    def analyze_screen(self, image_bytes: Optional[bytes] = None) -> List[UICandidate]:
        # Return mock parsed interactive UI elements for target grounding
        return [
            UICandidate(
                id="target_01",
                label="blue button",
                element_type="button",
                bounding_box={"x": 350, "y": 420, "width": 120, "height": 45},
                confidence=0.94
            ),
            UICandidate(
                id="target_02",
                label="WhatsApp photo image",
                element_type="image",
                bounding_box={"x": 200, "y": 150, "width": 300, "height": 200},
                confidence=0.96
            ),
            UICandidate(
                id="target_03",
                label="search bar",
                element_type="input",
                bounding_box={"x": 100, "y": 50, "width": 500, "height": 40},
                confidence=0.92
            )
        ]


screen_analyzer = ScreenAnalyzer()
