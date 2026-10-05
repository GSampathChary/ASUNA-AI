import 'dart:math';
import 'package:flutter/material.dart';

class Particle {
  double x;
  double y;
  double radius;
  double angle;
  double speed;
  Color color;

  Particle({
    required this.x,
    required this.y,
    required this.radius,
    required this.angle,
    required this.speed,
    required this.color,
  });
}

class AsunaHumanoidPainter extends CustomPainter {
  final String state;
  final double animationValue;
  final double yaw;
  final double pitch;
  final List<Particle> particles;

  AsunaHumanoidPainter({
    required this.state,
    required this.animationValue,
    required this.yaw,
    required this.pitch,
    required this.particles,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2 + 10);
    final headRadius = min(size.width, size.height) * 0.26;

    // Apply 3D Perspective Offsets based on Head Yaw and Pitch
    final headOffsetX = yaw * 25.0;
    final headOffsetY = pitch * 18.0;
    final headCenter = Offset(center.dx + headOffsetX, center.dy - 30 + headOffsetY);

    // 1. Royal Crimson Energy Background Glow
    final glowPaint = Paint()
      ..color = const Color(0xFFFF1E42).withOpacity(0.35)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 30);
    canvas.drawCircle(headCenter, headRadius * 1.5, glowPaint);

    // 2. Neck & Cybernetic Shoulder Base Harness
    final shoulderPath = Path()
      ..moveTo(center.dx - headRadius * 1.6, center.dy + headRadius * 1.5)
      ..lineTo(center.dx - headRadius * 0.4, center.dy + headRadius * 0.6)
      ..lineTo(center.dx + headRadius * 0.4, center.dy + headRadius * 0.6)
      ..lineTo(center.dx + headRadius * 1.6, center.dy + headRadius * 1.5)
      ..close();

    final shoulderPaint = Paint()
      ..color = const Color(0xFF1F1F2E)
      ..style = PaintingStyle.fill;
    canvas.drawPath(shoulderPath, shoulderPaint);

    final collarPaint = Paint()
      ..color = const Color(0xFFFF1E42)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;
    canvas.drawPath(shoulderPath, collarPaint);

    // Neck Cylinder Joint
    final neckRect = Rect.fromCenter(
      center: Offset(center.dx + headOffsetX * 0.4, center.dy + 15 + headOffsetY * 0.4),
      width: headRadius * 0.7,
      height: headRadius * 0.8,
    );
    canvas.drawRRect(RRect.fromRectAndRadius(neckRect, const Radius.circular(8)), Paint()..color = const Color(0xFF111118));

    // 3. 3D Cranium & Skull Structure
    final skullPath = Path();
    final topHead = Offset(headCenter.dx, headCenter.dy - headRadius * 1.1);
    final leftCheek = Offset(headCenter.dx - headRadius * 0.85, headCenter.dy - headRadius * 0.1);
    final rightCheek = Offset(headCenter.dx + headRadius * 0.85, headCenter.dy - headRadius * 0.1);

    // Jaw Articulation (Opens down when SPEAKING)
    final jawOpening = state == 'SPEAKING' ? (sin(animationValue * pi * 8).abs() * 12.0) : 0.0;
    final chinPoint = Offset(headCenter.dx, headCenter.dy + headRadius * 0.95 + jawOpening);

    skullPath.moveTo(topHead.dx, topHead.dy);
    skullPath.quadraticBezierTo(leftCheek.dx - 10, headCenter.dy - headRadius * 0.6, leftCheek.dx, leftCheek.dy);
    skullPath.lineTo(chinPoint.dx - headRadius * 0.35, chinPoint.dy - 10);
    skullPath.lineTo(chinPoint.dx, chinPoint.dy);
    skullPath.lineTo(chinPoint.dx + headRadius * 0.35, chinPoint.dy - 10);
    skullPath.lineTo(rightCheek.dx, rightCheek.dy);
    skullPath.quadraticBezierTo(rightCheek.dx + 10, headCenter.dy - headRadius * 0.6, topHead.dx, topHead.dy);
    skullPath.close();

    // Warm ceramic face and auburn hair mirror the desktop Asuna avatar.
    final headPaint = Paint()
      ..color = const Color(0xFFF6C9AF)
      ..style = PaintingStyle.fill;
    canvas.drawPath(skullPath, headPaint);

    final hairPaint = Paint()..color = const Color(0xFF9D4F32);
    final fringe = Path()
      ..moveTo(topHead.dx - headRadius * 0.62, topHead.dy + headRadius * 0.33)
      ..quadraticBezierTo(topHead.dx, topHead.dy - headRadius * 0.28, topHead.dx + headRadius * 0.62, topHead.dy + headRadius * 0.33)
      ..lineTo(topHead.dx + headRadius * 0.36, topHead.dy + headRadius * 0.18)
      ..quadraticBezierTo(topHead.dx, topHead.dy + headRadius * 0.42, topHead.dx - headRadius * 0.36, topHead.dy + headRadius * 0.18)
      ..close();
    canvas.drawPath(fringe, hairPaint);
    for (final side in [-1.0, 1.0]) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(center: Offset(headCenter.dx + side * headRadius * 0.76, headCenter.dy + headRadius * 0.22), width: headRadius * 0.17, height: headRadius * 1.15),
          const Radius.circular(10),
        ),
        hairPaint,
      );
    }

    // Wireframe Mesh & Facial Grid Overlay
    final wireframePaint = Paint()
      ..color = Colors.white.withOpacity(0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    canvas.drawPath(skullPath, wireframePaint);

    // Crimson Jaw Accent
    final jawPaint = Paint()
      ..color = const Color(0xFFFF1E42)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    final jawPath = Path()
      ..moveTo(leftCheek.dx + 5, leftCheek.dy + 10)
      ..lineTo(chinPoint.dx, chinPoint.dy)
      ..lineTo(rightCheek.dx - 5, rightCheek.dy + 10);
    canvas.drawPath(jawPath, jawPaint);

    // 4. Dual Ocular Glowing Eyes & Pupils
    final leftEyePos = Offset(headCenter.dx - headRadius * 0.36 + headOffsetX * 0.2, headCenter.dy - headRadius * 0.15 + headOffsetY * 0.2);
    final rightEyePos = Offset(headCenter.dx + headRadius * 0.36 + headOffsetX * 0.2, headCenter.dy - headRadius * 0.15 + headOffsetY * 0.2);

    final eyeGlowPaint = Paint()..color = const Color(0xFFFFFBF5);
    final irisPaint = Paint()..color = const Color(0xFFA86A35);
    final pupilPaint = Paint()..color = const Color(0xFF22100B);
    final eyeAim = Offset(yaw * 2.8, pitch * 2.2);
    final blink = state == 'CLICKING' ? 0.45 : 1.0;

    canvas.drawOval(Rect.fromCenter(center: leftEyePos, width: 15, height: 17 * blink), eyeGlowPaint);
    canvas.drawCircle(leftEyePos + eyeAim, 4.5 * blink, irisPaint);
    canvas.drawCircle(leftEyePos + eyeAim, 2.3 * blink, pupilPaint);

    canvas.drawOval(Rect.fromCenter(center: rightEyePos, width: 15, height: 17 * blink), eyeGlowPaint);
    canvas.drawCircle(rightEyePos + eyeAim, 4.5 * blink, irisPaint);
    canvas.drawCircle(rightEyePos + eyeAim, 2.3 * blink, pupilPaint);

    // Brow Ridge & Nose Line
    final browPaint = Paint()
      ..color = const Color(0xFFFF1E42)
      ..strokeWidth = 2.2
      ..style = PaintingStyle.stroke;
    canvas.drawLine(
      Offset(leftEyePos.dx - 8, leftEyePos.dy - 12),
      Offset(rightEyePos.dx + 8, rightEyePos.dy - 12),
      browPaint,
    );
    canvas.drawLine(
      Offset(headCenter.dx, leftEyePos.dy - 12),
      Offset(headCenter.dx, leftEyePos.dy + 18),
      browPaint,
    );
    if (state == 'CLICKING') {
      final smilePaint = Paint()
        ..color = const Color(0xFFC91F42)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.2;
      canvas.drawArc(
        Rect.fromCenter(center: Offset(headCenter.dx, chinPoint.dy - 20), width: headRadius * 0.36, height: headRadius * 0.18),
        0,
        pi,
        false,
        smilePaint,
      );
    }
    // 5. Orbiting Swarm Particles
    for (var p in particles) {
      final pOffset = Offset(
        headCenter.dx + cos(p.angle + animationValue * pi * 2) * (headRadius * 1.6),
        headCenter.dy + sin(p.angle + animationValue * pi * 2) * (headRadius * 1.6),
      );
      final pPaint = Paint()..color = p.color;
      canvas.drawCircle(pOffset, p.radius, pPaint);
    }
  }

  @override
  bool shouldRepaint(covariant AsunaHumanoidPainter oldDelegate) => true;
}

class AsunaCoreWidget extends StatefulWidget {
  final String currentState;
  const AsunaCoreWidget({super.key, required this.currentState});

  @override
  State<AsunaCoreWidget> createState() => _AsunaCoreWidgetState();
}

class _AsunaCoreWidgetState extends State<AsunaCoreWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<Particle> _particles = [];
  final Random _rng = Random();

  double _targetYaw = 0.0;
  double _targetPitch = 0.0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat();

    for (int i = 0; i < 60; i++) {
      _particles.add(Particle(
        x: 0,
        y: 0,
        radius: 1.5 + _rng.nextDouble() * 2.5,
        angle: _rng.nextDouble() * pi * 2,
        speed: 0.5 + _rng.nextDouble(),
        color: _rng.nextBool()
            ? Colors.white.withOpacity(0.7 + _rng.nextDouble() * 0.3)
            : const Color(0xFFFF1E42).withOpacity(0.7 + _rng.nextDouble() * 0.3),
      ));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onPanUpdate(DragUpdateDetails details, Size size) {
    setState(() {
      _targetYaw = ((details.localPosition.dx / size.width) * 2 - 1).clamp(-1.0, 1.0);
      _targetPitch = ((details.localPosition.dy / size.height) * 2 - 1).clamp(-1.0, 1.0);
    });
  }

  void _onPanEnd(DragEndDetails details) {
    setState(() {
      _targetYaw = 0.0;
      _targetPitch = 0.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final widgetSize = Size(constraints.maxWidth > 0 ? constraints.maxWidth : 280, 280);
        return GestureDetector(
          onPanUpdate: (details) => _onPanUpdate(details, widgetSize),
          onPanEnd: _onPanEnd,
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return CustomPaint(
                size: widgetSize,
                painter: AsunaHumanoidPainter(
                  state: widget.currentState,
                  animationValue: _controller.value,
                  yaw: _targetYaw,
                  pitch: _targetPitch,
                  particles: _particles,
                ),
              );
            },
          ),
        );
      },
    );
  }
}
