import 'package:flutter/services.dart';

/// Android-only actions invoked after a verified gateway command arrives.
class NativeDeviceService {
  static const _channel = MethodChannel('asuna_ai/device_control');

  Future<void> executeRemoteAction(Map<String, dynamic> message) async {
    final action = message['action'] as String? ?? '';
    final args = Map<String, dynamic>.from(message['args'] as Map? ?? const {});
    final command = (message['command'] as String? ?? '').toLowerCase();

    switch (action) {
      case 'toggle_flashlight':
        await _channel.invokeMethod<void>('toggleFlashlight', {
          'enabled': args['state'] == 'on',
        });
        return;
      case 'set_volume':
        await _channel.invokeMethod<void>('setVolume', {
          'level': (args['level'] as num?)?.clamp(0, 100).toInt() ?? 50,
        });
        return;
      case 'volume_up':
        await _channel.invokeMethod<void>('setVolume', {'level': 100});
        return;
      case 'volume_down':
        await _channel.invokeMethod<void>('setVolume', {'level': 20});
        return;
      case 'open_application':
      case 'open_browser':
        final application = (args['application'] as String? ?? command).toLowerCase();
        final packageName = application.contains('youtube')
            ? 'com.google.android.youtube'
            : 'com.android.chrome';
        final launched = await _channel.invokeMethod<bool>('launchApp', {'packageName': packageName});
        if (launched != true) {
          throw PlatformException(code: 'APP_NOT_INSTALLED', message: '$packageName is not installed.');
        }
        return;
      default:
        throw PlatformException(code: 'UNSUPPORTED_ACTION', message: 'Unsupported Android action: $action');
    }
  }
}
