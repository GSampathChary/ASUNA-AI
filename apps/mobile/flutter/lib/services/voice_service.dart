import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

class VoiceService {
  final SpeechToText _speech = SpeechToText();
  final FlutterTts _tts = FlutterTts();
  bool _ready = false;
  double _speechRate = 0.48;

  Future<bool> initialize({required void Function(String) onError}) async {
    _ready = await _speech.initialize(onError: (error) => onError(error.errorMsg));
    await _tts.setSpeechRate(_speechRate);
    return _ready;
  }

  bool get isListening => _speech.isListening;
  double get speechRate => _speechRate;

  /// Set the speech rate for TTS. Accepts values between 0.0 and 1.0.
  Future<void> setSpeechRate(double rate) async {
    _speechRate = rate.clamp(0.3, 1.0);
    if (_ready) {
      await _tts.setSpeechRate(_speechRate);
    }
  }

  Future<void> listen(void Function(String words, bool isFinal) onResult) async {
    if (!_ready) throw StateError('Speech recognition is unavailable on this device.');
    await _speech.listen(
      onResult: (SpeechRecognitionResult result) => onResult(result.recognizedWords, result.finalResult),
      // Faster response for live calls
      listenFor: const Duration(seconds: 15),
      pauseFor: const Duration(seconds: 2),
      partialResults: true,
      localeId: 'en_IN',
    );
  }

  Future<void> stop() => _speech.stop();

  Future<void> speak(String text) async {
    await _tts.stop();
    await _tts.speak(text);
  }

  Future<void> dispose() async {
    await _speech.stop();
    await _tts.stop();
  }
}
