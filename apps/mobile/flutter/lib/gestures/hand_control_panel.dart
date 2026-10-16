import 'dart:math' as math;

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:hand_landmarker/hand_landmarker.dart';

/// Live CameraX + MediaPipe hand landmark view.  Pinch thumb/index to submit
/// the current message; bring index/middle together to switch gesture mode.
class HandControlPanel extends StatefulWidget {
  const HandControlPanel({super.key, required this.onGesture, required this.onClose});

  final ValueChanged<String> onGesture;
  final VoidCallback onClose;

  @override
  State<HandControlPanel> createState() => _HandControlPanelState();
}

class _HandControlPanelState extends State<HandControlPanel> {
  CameraController? _camera;
  HandLandmarkerPlugin? _landmarker;
  String _status = 'Starting hand tracking…';
  String _lastGesture = '';
  DateTime _lastGestureAt = DateTime.fromMillisecondsSinceEpoch(0);
  bool _detecting = false;

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    try {
      final cameras = await availableCameras();
      final selected = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      _camera = CameraController(selected, ResolutionPreset.medium, enableAudio: false);
      _landmarker = HandLandmarkerPlugin.create(
        numHands: 1,
        minHandDetectionConfidence: 0.7,
        delegate: HandLandmarkerDelegate.gpu,
      );
      await _camera!.initialize();
      await _camera!.startImageStream((image) {
        if (_detecting || _landmarker == null || _camera == null) return;
        _detecting = true;
        try {
          _onHands(_landmarker!.detect(image, _camera!.description.sensorOrientation));
        } catch (_) {
          // A dropped camera frame is expected while the native detector works.
        } finally {
          _detecting = false;
        }
      });
      if (mounted) setState(() => _status = 'Show one hand · pinch thumb + index to send');
    } catch (error) {
      if (mounted) setState(() => _status = 'Hand tracking unavailable: $error');
    }
  }

  void _onHands(List<Hand> hands) {
    if (hands.isEmpty) return;
    final points = hands.first.landmarks;
    if (points.length < 13) return;
    final pinch = _distance(points[4], points[8]);
    final twoFinger = _distance(points[8], points[12]);
    final gesture = pinch < 0.06 ? 'PINCH' : twoFinger < 0.065 ? 'TWO_FINGER' : '';
    if (gesture.isEmpty) return;
    final now = DateTime.now();
    if (_lastGesture == gesture && now.difference(_lastGestureAt).inMilliseconds < 900) return;
    _lastGesture = gesture;
    _lastGestureAt = now;
    widget.onGesture(gesture);
    if (mounted) setState(() => _status = gesture == 'PINCH' ? 'Pinch detected' : 'Two-finger gesture detected');
  }

  double _distance(Landmark one, Landmark two) => math.sqrt(math.pow(one.x - two.x, 2) + math.pow(one.y - two.y, 2));

  @override
  void dispose() {
    _camera?.stopImageStream();
    _camera?.dispose();
    _landmarker?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final camera = _camera;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(title: const Text('Asuna-AI hand controls'), actions: [IconButton(onPressed: widget.onClose, icon: const Icon(Icons.close))]),
      body: camera == null || !camera.value.isInitialized
          ? Center(child: Text(_status, textAlign: TextAlign.center))
          : Stack(children: [
              Center(child: CameraPreview(camera)),
              Positioned(left: 16, right: 16, bottom: 24, child: Card(color: Colors.black87, child: Padding(padding: const EdgeInsets.all(12), child: Text(_status)))),
            ]),
    );
  }
}
