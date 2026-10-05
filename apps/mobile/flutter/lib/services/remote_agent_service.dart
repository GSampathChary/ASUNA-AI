import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import 'native_device_service.dart';

class RemoteAgentService {
  RemoteAgentService(this._deviceService);

  final NativeDeviceService _deviceService;
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  String _status = 'Offline';
  String get status => _status;
  void Function(String status)? onStatus;
  void Function(String message)? onEvent;

  Future<void> connect({
    required String websocketUrl,
    required String email,
    required String pairingToken,
    required String deviceId,
  }) async {
    await disconnect();
    if (!websocketUrl.startsWith('ws://') && !websocketUrl.startsWith('wss://')) {
      throw ArgumentError('Gateway URL must start with ws:// or wss://');
    }
    _status = 'Connecting';
    onStatus?.call(_status);
    _channel = WebSocketChannel.connect(Uri.parse(websocketUrl));
    _subscription = _channel!.stream.listen(
      (raw) => _handleMessage(jsonDecode(raw as String) as Map<String, dynamic>),
      onError: (_) => _setOffline(),
      onDone: _setOffline,
      cancelOnError: false,
    );
    _channel!.sink.add(jsonEncode({
      'type': 'agent_register',
      'email': email.trim(),
      'device_type': 'mobile',
      'device_id': deviceId,
      'pairing_token': pairingToken,
    }));
  }

  Future<void> _handleMessage(Map<String, dynamic> message) async {
    if (message['type'] == 'registered') {
      _status = 'Paired and online';
      onStatus?.call(_status);
      onEvent?.call('Secure gateway paired.');
      return;
    }
    if (message['type'] == 'error') {
      _status = 'Pairing failed';
      onStatus?.call(_status);
      onEvent?.call(message['message'] as String? ?? 'Gateway error');
      return;
    }
    if (message['type'] == 'remote_action') {
      try {
        await _deviceService.executeRemoteAction(message);
        onEvent?.call('Completed: ${message['action']}');
      } catch (error) {
        onEvent?.call('Action failed: $error');
      }
    }
  }

  Future<void> disconnect() async {
    await _subscription?.cancel();
    await _channel?.sink.close();
    _subscription = null;
    _channel = null;
    _setOffline();
  }

  void _setOffline() {
    _status = 'Offline';
    onStatus?.call(_status);
  }
}
