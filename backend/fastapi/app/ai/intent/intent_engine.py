import re
from typing import Dict, Any, Optional
from pydantic import BaseModel


class ExtractedIntent(BaseModel):
    raw_query: str
    normalized_intent: str
    primary_language: str  # en, te, hi, te_en, hi_en
    tool_name: Optional[str] = None
    arguments: Dict[str, Any] = {}
    confidence: float = 0.90


class IntentEngine:
    """Normalizes natural language inputs in English, Telugu (Telangana dialect), Hindi, Hinglish, and Teluglish."""

    PATTERNS = [
        # Phone Feature Control (Calls, Flashlight, Camera, Battery)
        (r"(?i)(flashlight|torch)\b.*\b(on|off|chalu|bondh|band)", "toggle_flashlight"),
        (r"(?i)(call|phone|matlaadu)\s+(karo|cheyyi|to)?\s*(.*)", "make_call"),
        (r"(?i)(camera|photo)\s+(open|teeyyi|khicho|cheyyi)", "take_photo"),

        # Open App / Web (Telugu / Hindi / English)
        (r"(?i)(.*)\s+(open\s+cheyyi|teeyyi|open\s+karo|chalu\s+karo|kholo)", "open_application"),
        (r"(?i)(open|launch|start|kholo)\s+(.*)", "open_application"),

        # Send message / share photo (WhatsApp / Phone)
        (r"(?i)(.*)\s+(whatsapp\s+lo\s+pampu|send\s+cheyyi|pampinchu|bhejo|whatsapp\s+per\s+bhejo)", "send_message"),
        (r"(?i)send\s+(.*)\s+to\s+(.*)", "send_message"),

        # Volume & Media controls (Telugu / Hindi / English)
        (r"(?i)(volume|sound)\b.*\b(thagginchu|thagga|kam\s+karo|low\s+cheyyi|dheema)", "volume_down"),
        (r"(?i)(volume|sound)\b.*\b(penchu|tez\s+karo|ekkuva\s+cheyyi|high\s+cheyyi)", "volume_up"),
        (r"(?i)(song|video|music)\b.*\b(pause\s+cheyyi|rok\0|apuko|apu|stop)", "media_pause"),
        (r"(?i)(song|video|music)\b.*\b(play\s+cheyyi|starthu|chalu\s+cheyyi|chalao)", "media_play"),

        # Search / Browse
        (r"(?i)(.*)\s+(gurinchi\s+search\s+cheyyi|choodu|huduk|khojo|search\s+karo)", "web_search"),
        (r"(?i)search\s+for\s+(.*)", "web_search"),
    ]

    def process_query(self, query: str) -> ExtractedIntent:
        clean_query = query.strip()
        lower = clean_query.lower()

        is_telugu = any(w in lower for w in ["cheyyi", "pampu", "thagginchu", "penchu", "choodu", "lo", "koncham", "matlaadu", "teeyyi"])
        is_hindi = any(w in lower for w in ["karo", "bhejo", "kholo", "chalao", "kam", "tez", "dheema", "suno", "bataye", "namaste", "kaise", "chalu"])

        lang = "te_en" if is_telugu else "hi_en" if is_hindi else "en"

        for pattern, intent_name in self.PATTERNS:
            match = re.search(pattern, clean_query)
            if match:
                args = {}
                tool_name = None
                groups = match.groups()

                if intent_name == "toggle_flashlight":
                    state = "on" if any(w in lower for w in ["on", "chalu", "open"]) else "off"
                    args = {"state": state}
                    tool_name = "toggle_flashlight"

                elif intent_name == "open_application":
                    raw_app = groups[0] if len(groups) > 0 else "browser"
                    clean_app = re.sub(r"(?i)^(asuna\s+|hey\s+asuna\s+)", "", raw_app).strip()
                    clean_app = clean_app.replace("open", "").replace("cheyyi", "").replace("karo", "").replace("kholo", "").strip()
                    if not clean_app:
                        clean_app = "browser"

                    app_name = "YouTube" if clean_app.lower() == "youtube" else clean_app.capitalize()
                    args = {"application": app_name}
                    tool_name = "open_app" if app_name.lower() not in ["chrome", "browser"] else "open_browser"

                elif intent_name == "send_message":
                    target = groups[0] if len(groups) > 0 else "message"
                    args = {"message": target, "platform": "whatsapp"}
                    tool_name = "send_message"

                elif intent_name == "make_call":
                    recipient = groups[-1] if len(groups) > 0 else "contact"
                    args = {"contact": recipient}
                    tool_name = "make_phone_call"

                elif intent_name == "take_photo":
                    args = {"mode": "photo"}
                    tool_name = "open_camera"

                elif intent_name in ["volume_down", "volume_up", "media_pause", "media_play"]:
                    cmd = "volume_down" if intent_name == "volume_down" else "volume_up" if intent_name == "volume_up" else "pause" if intent_name == "media_pause" else "play"
                    args = {"command": cmd}
                    tool_name = "media_control"

                elif intent_name == "web_search":
                    topic = groups[0] if len(groups) > 0 else clean_query
                    args = {"url": f"https://www.google.com/search?q={topic.strip()}"}
                    tool_name = "open_browser"

                return ExtractedIntent(
                    raw_query=clean_query,
                    normalized_intent=intent_name,
                    primary_language=lang,
                    tool_name=tool_name,
                    arguments=args,
                    confidence=0.95
                )

        return ExtractedIntent(
            raw_query=clean_query,
            normalized_intent="chatgpt_general_knowledge",
            primary_language=lang,
            tool_name=None,
            arguments={},
            confidence=0.85
        )


intent_engine = IntentEngine()
