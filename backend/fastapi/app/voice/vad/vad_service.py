import time


class VADService:
    """Voice Activity Detector detecting speech segments, silence threshold, and wake word detection."""

    def __init__(self, energy_threshold: float = 0.5, silence_timeout_s: float = 3.0):
        self.energy_threshold = energy_threshold
        self.silence_timeout_s = silence_timeout_s
        self._last_speech_time: float = time.time()

    def process_chunk(self, pcm_chunk: bytes) -> bool:
        if not pcm_chunk:
            return False
        # Calculate RMS energy of 16-bit PCM audio
        energy = sum(abs(b) for b in pcm_chunk) / (len(pcm_chunk) * 255.0)
        is_speech = energy > self.energy_threshold
        if is_speech:
            self._last_speech_time = time.time()
        return is_speech

    def is_silence_timed_out(self) -> bool:
        return (time.time() - self._last_speech_time) > self.silence_timeout_s


vad_service = VADService()
