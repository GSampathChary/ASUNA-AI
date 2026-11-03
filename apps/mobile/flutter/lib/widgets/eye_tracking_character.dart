import 'dart:math';
import 'package:flutter/material.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

class EyeTrackingCharacter extends StatefulWidget {
  const EyeTrackingCharacter({Key? key}) : super(key: key);

  @override
  State<EyeTrackingCharacter> createState() => _EyeTrackingCharacterState();
}

class _EyeTrackingCharacterState extends State<EyeTrackingCharacter> {
  // Position offsets based on device tilt
  double _dx = 0.0;
  double _dy = 0.0;
  late final StreamSubscription<AccelerometerEvent> _accelSub;

  @override
  void initState() {
    super.initState();
    // Listen to accelerometer to simulate eye‑gaze direction
    _accelSub = accelerometerEvents.listen((event) {
      // Map accelerometer values to a small offset range
      setState(() {
        _dx = (event.x / 10).clamp(-0.5, 0.5);
        _dy = (event.y / 10).clamp(-0.5, 0.5);
      });
    });
  }

  @override
  void dispose() {
    _accelSub.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Load the character asset (ensure the image exists at assets/character.png)
    return Align(
      alignment: Alignment(_dx, _dy),
      child: Image.asset(
        'assets/character.png',
        width: 80,
        height: 80,
        fit: BoxFit.contain,
      ),
    );
  }
}
