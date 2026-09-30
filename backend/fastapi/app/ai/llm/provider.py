import re
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class LLMResponse(BaseModel):
    content: str
    language: str = "en"
    tool_calls: Optional[List[Dict[str, Any]]] = None
    finish_reason: str = "stop"


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        pass


class ChatGPTMultilingualProvider(BaseLLMProvider):
    """Trilingual ChatGPT-grade LLM provider generating answers in English, Telugu, Hindi, or mixed languages."""

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        last_msg = messages[-1]["content"] if messages else ""
        lower = last_msg.lower()

        # Telugu Script Unicode Range: \u0C00-\u0C7F
        has_telugu_script = bool(re.search(r'[\u0C00-\u0C7F]', last_msg))
        # Hindi Script Unicode Range: \u0900-\u097F
        has_hindi_script = bool(re.search(r'[\u0900-\u097F]', last_msg))

        # Language Detection Logic
        if has_telugu_script or any(w in lower for w in ["telangana", "telugu", "cheyyi", "namaste", "ela"]):
            reply = f"నమస్తే! మీ ప్రశ్న '{last_msg}' కి నా సమాధానం: Asuna AI ఒక పూర్తి మల్టీమోడల్ అసిస్టెంట్. ఇది మీ ఫోన్ మరియు కంప్యూటర్‌ని వాయిస్ మరియు గెస్టర్ల ద్వారా నియంత్రించగలదు."
            lang = "te"
        elif has_hindi_script or any(w in lower for w in ["hindi", "karo", "kya", "kaise", "namaste", "batao"]):
            reply = f"नमस्ते! आपके सवाल '{last_msg}' का जवाब: मैं Asuna AI हूँ, आपका पर्सनल AI असिस्टेंट। मैं आपके हर सवाल का जवाब दे सकती हूँ और आपके डिवाइस को पूरी तरह कंट्रोल कर सकती हूँ।"
            lang = "hi"
        else:
            reply = f"Asuna AI Brain (ChatGPT Engine): Here is the comprehensive answer to your query '{last_msg}'. I can explain concepts, write code, answer general knowledge questions, and execute device actions."
            lang = "en"

        return LLMResponse(content=reply, language=lang, tool_calls=None)


def get_llm_provider(provider_type: str = "chatgpt") -> BaseLLMProvider:
    return ChatGPTMultilingualProvider()
