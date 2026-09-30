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

class AsunaCorePainter extends CustomPainter {
  final String state;
  final double animationValue;
  final List<Particle> particles;

  AsunaCorePainter({
    required this.state,
    required this.animationValue,
    required this.particles,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final baseRadius = min(size.width, size.height) * 0.22;

    double scale = 1.0;
    if (state == 'CLICKING') {
      scale = 1.0 + sin(animationValue * pi * 4) * 0.09;
    } else if (state == 'ZOOMING_IN') {
      scale = 1.25;
    } else if (state == 'ZOOMING_OUT') {
      scale = 0.8;
    }

    final currentRadius = baseRadius * scale;

    // 1. Draw Royal Crimson Red Energy Glow
    final glowPaint = Paint()
      ..color = const Color(0xFFFF1E42).withOpacity(0.3)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 25);
    canvas.drawCircle(center, currentRadius * 1.4, glowPaint);

    // 2. Draw Outer Floating Diamond / Octahedron Wireframe Path in Gold & Red
    final diamondPaint = Paint()
      ..color = state == 'ERROR' ? Colors.redAccent : const Color(0xFFFF1E42)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.8;

    final path = Path()
      ..moveTo(center.dx, center.dy - currentRadius * 1.3)
      ..lineTo(center.dx + currentRadius, center.dy)
      ..lineTo(center.dx, center.dy + currentRadius * 1.3)
      ..lineTo(center.dx - currentRadius, center.dy)
      ..close();

    canvas.drawPath(path, diamondPaint);

    // Inner Gold Core Ring
    final goldInnerPaint = Paint()
      ..color = const Color(0xFFFFD700)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawCircle(center, currentRadius * 0.5, goldInnerPaint);

    // 3. Draw Orbital Imperial Gold Particles
    for (var p in particles) {
      final pOffset = Offset(
        center.dx + cos(p.angle + animationValue * pi * 2) * (currentRadius * 1.5),
        center.dy + sin(p.angle + animationValue * pi * 2) * (currentRadius * 1.5),
      );
      final pPaint = Paint()..color = p.color;
      canvas.drawCircle(pOffset, p.radius, pPaint);
    }
  }

  @override
  bool shouldRepaint(covariant AsunaCorePainter oldDelegate) => true;
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

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat();

    for (int i = 0; i < 65; i++) {
      _particles.add(Particle(
        x: 0,
        y: 0,
        radius: 1.5 + _rng.nextDouble() * 2.5,
        angle: _rng.nextDouble() * pi * 2,
        speed: 0.5 + _rng.nextDouble(),
        color: _rng.nextBool()
            ? const Color(0xFFFFD700).withOpacity(0.7 + _rng.nextDouble() * 0.3)
            : const Color(0xFFFF1E42).withOpacity(0.7 + _rng.nextDouble() * 0.3),
      ));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: const Size(260, 260),
          painter: AsunaCorePainter(
            state: widget.currentState,
            animationValue: _controller.value,
            particles: _particles,
          ),
        );
      },
    );
  }
}
