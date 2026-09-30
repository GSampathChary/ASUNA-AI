import asyncio
import json
import os
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from typing import Dict, List, Optional

from pydantic import BaseModel


class LLMResponse(BaseModel):
    content: str
    language: str = "en"
    tool_calls: Optional[List[Dict[str, str]]] = None
    finish_reason: str = "stop"


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> LLMResponse:
        pass


class OpenAIResponsesProvider(BaseLLMProvider):
    """Server-side Responses API client. The API key is never sent to the browser."""

    async def generate_response(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> LLMResponse:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        payload = json.dumps({
            "model": os.getenv("OPENAI_MODEL", "gpt-5"),
            "instructions": (
                "You are Asuna, a thoughtful personal AI assistant. Give accurate, concise, useful answers. "
                "Never claim to have controlled a device or accessed camera, microphone, files, or other apps unless a trusted agent explicitly reports success. "
                "For consequential device actions, explain what will happen and ask for confirmation."
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

    async def generate_response(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> LLMResponse:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        contents = []
        for message in messages:
            role = "model" if message.get("role") == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": message.get("content", "")} ]})
        model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        payload = json.dumps({
            "systemInstruction": {"parts": [{"text": (
                "You are Asuna, a helpful, accurate personal AI assistant. Answer naturally and clearly. "
                "Never claim device control or sensor access unless a trusted paired device agent confirms it."
            )}]},
            "contents": contents,
            "generationConfig": {"temperature": temperature},
        }).encode("utf-8")

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

        try:
            try:
                result = await asyncio.to_thread(request_response, model)
            except urllib.error.HTTPError as err:
                # Gemini 1.5 Flash is no longer available for this endpoint.
                # Fall back to the documented 2.0 Flash model when a project
                # does not have the configured model enabled.
                if err.code in (404, 400) and model != "gemini-2.0-flash":
                    result = await asyncio.to_thread(request_response, "gemini-2.0-flash")
                else:
                    raise
            parts = result["candidates"][0]["content"]["parts"]
            return LLMResponse(content="".join(part.get("text", "") for part in parts))
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
    async def generate_response(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> LLMResponse:
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
