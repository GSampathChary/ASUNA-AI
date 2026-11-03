import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiService {
  ApiService(this.baseUrl);

  final String baseUrl;

  Future<String> sendChat({
    required String message,
    required String email,
    required List<Map<String, String>> history,
    String? sessionToken,
    String userNickname = '',
    String targetDevice = 'local',
    void Function(int attempt, String statusMsg)? onRetry,
  }) async {
    final uri = Uri.parse('${baseUrl.replaceAll(RegExp(r'/$'), '')}/api/chat');
    final body = jsonEncode({
      'message': message,
      'history': history.take(8).toList(),
      'user_email': email,
      'user_nickname': userNickname,
      'target_device': targetDevice,
      'client_time': DateTime.now().toIso8601String(),
      'client_timezone': DateTime.now().timeZoneName,
    });
    final headers = {
      'Content-Type': 'application/json',
      if (sessionToken != null) 'X-Asuna-Session': sessionToken,
    };

    // Network failures can be Exceptions, but HTTP failures are represented as
    // StateError (an Error). Keep the complete Dart error hierarchy here so
    // the final failure can be propagated without an invalid cast.
    Object? lastError;
    for (int attempt = 0; attempt < 4; attempt++) {
      try {
        final response = await http
            .post(uri, headers: headers, body: body)
            .timeout(const Duration(seconds: 50));

        if (response.statusCode >= 200 && response.statusCode < 300) {
          final payload = jsonDecode(response.body) as Map<String, dynamic>;
          return payload['reply']?.toString() ??
              'I could not generate a response.';
        }

        final err = jsonDecode(response.body) as Map<String, dynamic>;
        lastError = StateError(
          err['detail']?.toString() ??
              'The Asuna-AI service returned ${response.statusCode}.',
        );

        // Only retry on transient errors
        if (![408, 429, 500, 502, 503, 504].contains(response.statusCode)) {
          throw lastError!;
        }
      } catch (e) {
        lastError = e is Exception ? e : StateError(e.toString());
      }

      if (attempt < 3) {
        final msg = attempt >= 1
            ? 'Server is waking up on Render (free tier), retrying…'
            : 'Connecting to AI service…';
        onRetry?.call(attempt + 1, msg);
        await Future<void>.delayed(Duration(seconds: attempt + 1));
      }
    }

    throw lastError ?? StateError('The AI service is unavailable.');
  }
}
