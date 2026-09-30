from abc import ABC, abstractmethod
from pydantic import BaseModel


class TTSResult(BaseModel):
    audio_bytes: bytes
    audio_format: str = "mp3"
    duration_seconds: float = 2.0


class BaseTTSProvider(ABC):
    @abstractmethod
    async def synthesize_speech(self, text: str, voice_id: str = "asuna_voice") -> TTSResult:
        pass


class MockTTSProvider(BaseTTSProvider):
    async def synthesize_speech(self, text: str, voice_id: str = "asuna_voice") -> TTSResult:
        # 1-second mock silent MP3 frame
        mock_mp3 = b"\xFF\xF3\x40\xC4\x00\x00\x00\x00" * 100
        return TTSResult(audio_bytes=mock_mp3, audio_format="mp3", duration_seconds=1.5)


def get_tts_provider() -> BaseTTSProvider:
    return MockTTSProvider()
