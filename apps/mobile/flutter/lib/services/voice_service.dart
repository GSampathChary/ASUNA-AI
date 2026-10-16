import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

class VoiceService {
  final SpeechToText _speech = SpeechToText();
  final FlutterTts _tts = FlutterTts();
  bool _ready = false;

  Future<bool> initialize({required void Function(String) onError}) async {
    _ready = await _speech.initialize(onError: (error) => onError(error.errorMsg));
    await _tts.setSpeechRate(0.48);
    return _ready;
  }

  bool get isListening => _speech.isListening;

  Future<void> listen(void Function(String words, bool isFinal) onResult) async {
    if (!_ready) throw StateError('Speech recognition is unavailable on this device.');
    await _speech.listen(
      onResult: (SpeechRecognitionResult result) => onResult(result.recognizedWords, result.finalResult),
      listenFor: const Duration(seconds: 35),
      pauseFor: const Duration(seconds: 4),
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
