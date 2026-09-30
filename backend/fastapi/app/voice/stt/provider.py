from abc import ABC, abstractmethod
from pydantic import BaseModel


class STTResult(BaseModel):
    transcript: str
    confidence: float
    language: str
    is_final: bool = True


class BaseSTTProvider(ABC):
    @abstractmethod
    async def transcribe_audio(self, audio_bytes: bytes, language_hint: str = "te") -> STTResult:
        pass


class MockSTTProvider(BaseSTTProvider):
    async def transcribe_audio(self, audio_bytes: bytes, language_hint: str = "te") -> STTResult:
        return STTResult(
            transcript="Asuna YouTube open cheyyi",
            confidence=0.96,
            language="te_en",
            is_final=True
        )


def get_stt_provider() -> BaseSTTProvider:
    return MockSTTProvider()
