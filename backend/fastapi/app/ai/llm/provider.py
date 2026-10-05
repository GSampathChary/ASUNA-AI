import asyncio
import json
import os
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from typing import Dict, List, Optional

from pydantic import BaseModel


# A Render instance stays alive for many requests.  Retaining the working model
# avoids a failed request plus a /models lookup on every chat message when a
# model alias is retired by Gemini.
_resolved_gemini_model: Optional[str] = None


class LLMResponse(BaseModel):
    content: str
    language: str = "en"
    tool_calls: Optional[List[Dict[str, str]]] = None
    finish_reason: str = "stop"


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        system_context: str = "",
    ) -> LLMResponse:
        pass


class OpenAIResponsesProvider(BaseLLMProvider):
    """Server-side Responses API client. The API key is never sent to the browser."""

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        system_context: str = "",
    ) -> LLMResponse:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        payload = json.dumps({
            "model": os.getenv("OPENAI_MODEL", "gpt-5"),
            "instructions": (
                "You are Asuna, a courteous, articulate personal AI assistant. Use the user's nickname from the system context when available. "
                "Never claim to have controlled a device or accessed camera, microphone, files, or other apps unless a trusted agent explicitly reports success. "
                "For consequential device actions, explain what will happen and ask for confirmation. "
                f"{system_context}"
            ),
            "input": messages,
        }).encode("utf-8")

        def request_response():
            request = urllib.request.Request(
                "https://api.openai.com/v1/responses",
                data=payload,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.loads(response.read().decode("utf-8"))

        try:
            result = await asyncio.to_thread(request_response)
        except urllib.error.HTTPError as error:
            raise RuntimeError(f"AI provider request failed ({error.code})") from error
        except urllib.error.URLError as error:
            raise RuntimeError("AI provider is unreachable") from error
        return LLMResponse(content=result.get("output_text", "I could not generate a response."))


class GeminiProvider(BaseLLMProvider):
    """Server-side Gemini REST provider. The key remains in Render, never the browser."""

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        system_context: str = "",
    ) -> LLMResponse:
        global _resolved_gemini_model
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        contents = []
        for message in messages:
            role = "model" if message.get("role") == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": message.get("content", "")} ]})
        # Flash is optimized for low latency.
        model = _resolved_gemini_model or os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"

        last_msg = messages[-1].get("content", "").lower() if messages else ""
        date_time_keywords = (
            "today", "date", "time", "day", "month", "year", "clock", "now", "calendar"
        )
        is_date_time_query = any(kw in last_msg for kw in date_time_keywords)

        # Only invoke external Google search for explicitly live data queries, avoiding search latency & date confusion on simple chat/date queries.
        search_triggers = (
            "latest news", "recent news", "live score", "match result", "current weather",
            "stock price", "who won", "election result", "breaking news"
        )
        needs_search = any(term in last_msg for term in search_triggers) and not is_date_time_query

        system_instruction_text = (
            f"CRITICAL SYSTEM CONTEXT:\n{system_context}\n\n"
            "IDENTITY AND PERSONA:\n"
            "You are Asuna, a polished, highly intelligent personal AI assistant. You speak with a courteous and slightly witty tone. "
            "Address the user using their nickname from the system context when one is provided.\n\n"
            "CROSS-DEVICE CONTROL CAPABILITIES:\n"
            "You are linked to a secure multi-device network connecting the user's Laptop (Windows/PC), Mobile Phone (Android/iOS), "
            "and Web interfaces under their account. When the user asks to perform an action on a specific device "
            "(e.g., 'open YouTube on my laptop', 'turn on flashlight on my phone', 'set volume to 80% on PC', 'check battery on laptop'), "
            "acknowledge the cross-device command smoothly as Asuna (e.g., 'Right away, Alex. Dispatching the command to your laptop.').\n\n"
            "ACCURACY RULES:\n"
            "When answering questions about today's date, current time, day of the week, month, or year, "
            "you MUST use the authoritative date/time provided in the system context above. Start with a direct answer."
        )

        request_body = {
            "systemInstruction": {"parts": [{"text": system_instruction_text}]},
            "contents": contents,
            "generationConfig": {"temperature": temperature, "maxOutputTokens": 1024},
        }
        if needs_search:
            request_body["tools"] = [{"google_search": {}}]
        payload = json.dumps(request_body).encode("utf-8")

        def request_response(model_name: str):
            request = urllib.request.Request(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent",
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key,
                },
                method="POST",
            )
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.loads(response.read().decode("utf-8"))

        def discover_generation_model() -> str:
            request = urllib.request.Request(
                "https://generativelanguage.googleapis.com/v1beta/models",
                headers={"x-goog-api-key": api_key},
                method="GET",
            )
            with urllib.request.urlopen(request, timeout=20) as response:
                models = json.loads(response.read().decode("utf-8")).get("models", [])
            available = {
                item.get("name", "").removeprefix("models/")
                for item in models
                if "generateContent" in item.get("supportedGenerationMethods", [])
            }
            # Prefer current Flash models, but only select one explicitly
            # advertised by the API key's project.
            preferred = (
                "gemini-3.5-flash",
                "gemini-3-flash",
                "gemini-2.5-flash",
                "gemini-2.5-flash-lite",
            )
            for candidate in preferred:
                if candidate in available:
                    return candidate
            if available:
                return sorted(available)[0]
            raise RuntimeError("No Gemini models with generateContent access are available for this API key.")

        try:
            try:
                result = await asyncio.to_thread(request_response, model)
            except urllib.error.HTTPError as err:
                # Model availability differs by project and changes over time.
                # Ask Gemini for the models this exact API key can use instead
                # of falling back to a retired hard-coded model name.
                if err.code in (404, 400):
                    available_model = await asyncio.to_thread(discover_generation_model)
                    result = await asyncio.to_thread(request_response, available_model)
                    _resolved_gemini_model = available_model
                else:
                    raise
            else:
                _resolved_gemini_model = model
            parts = result["candidates"][0]["content"]["parts"]
            text_parts = [
                part.get("text", "")
                for part in parts
                if isinstance(part, dict) and "text" in part and not part.get("thought", False)
            ]
            return LLMResponse(content="".join(text_parts) if text_parts else "I could not generate a response.")
        except urllib.error.HTTPError as error:
            err_body = error.read().decode("utf-8", errors="ignore") if hasattr(error, "read") else ""
            if error.code == 400 or error.code == 403:
                msg = f"Gemini API authentication failed ({error.code}). Check your GEMINI_API_KEY."
            elif error.code == 429:
                msg = "Gemini API quota exceeded or rate limited. Please try again later."
            else:
                msg = f"Gemini request failed ({error.code}): {err_body[:120]}"
            raise RuntimeError(msg) from error
        except (urllib.error.URLError, KeyError, IndexError) as error:
            raise RuntimeError("Gemini could not generate a response. Check network connectivity and model output format.") from error


class LocalFallbackProvider(BaseLLMProvider):
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        system_context: str = "",
    ) -> LLMResponse:
        question = messages[-1]["content"] if messages else ""
        return LLMResponse(content=(
            "The AI provider is not configured yet. Add GEMINI_API_KEY (or OPENAI_API_KEY) to your backend Environment Variables on Render (or in .env for local testing), "
            f"then I can answer questions such as: {question}"
        ))


def get_llm_provider() -> BaseLLMProvider:
    if os.getenv("GEMINI_API_KEY"):
        return GeminiProvider()
    if os.getenv("OPENAI_API_KEY"):
        return OpenAIResponsesProvider()
    return LocalFallbackProvider()
