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
  }) async {
    final normalizedBaseUrl = baseUrl.replaceAll(RegExp(r'/$'), '');
    final response = await http.post(
      Uri.parse('$normalizedBaseUrl/api/chat'),
      headers: {'Content-Type': 'application/json', if (sessionToken != null) 'X-Asuna-Session': sessionToken},
      body: jsonEncode({
        'message': message,
        'history': history.take(8).toList(),
        'user_email': email,
        'client_time': DateTime.now().toIso8601String(),
        'client_timezone': DateTime.now().timeZoneName,
      }),
    ).timeout(const Duration(seconds: 50));
    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError(payload['detail']?.toString() ?? 'The Asuna-AI service returned ${response.statusCode}.');
    }
    return payload['reply']?.toString() ?? 'I could not generate a response.';
  }
}
