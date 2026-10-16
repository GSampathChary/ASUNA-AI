import 'package:permission_handler/permission_handler.dart';

class PermissionService {
  /// Requests only capabilities that the app actually uses: voice, camera/
  /// hand tracking, notifications, and Bluetooth-headset speech support.
  Future<Map<Permission, PermissionStatus>> requestRequiredPermissions() {
    return [
      Permission.microphone,
      Permission.camera,
      Permission.notification,
      Permission.bluetoothConnect,
    ].request();
  }

  Future<void> openSettings() => openAppSettings();
}
