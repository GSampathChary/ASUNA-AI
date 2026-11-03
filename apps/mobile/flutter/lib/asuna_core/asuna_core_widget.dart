import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Animated Asuna AI core that supports 4 symbol types:
/// 'diamond' | 'icosahedron' | 'sphere' | 'pyramid'
class AsunaCoreWidget extends StatefulWidget {
  const AsunaCoreWidget({
    super.key,
    required this.currentState,
    this.symbolType = 'diamond',
    this.onTap,
  });
  final String currentState;
  final String symbolType;
  final VoidCallback? onTap;

  @override
  State<AsunaCoreWidget> createState() => _AsunaCoreWidgetState();
}
class _AsunaCoreWidgetState extends State<AsunaCoreWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animation;

  @override
  void initState() {
    super.initState();
    _animation =
        AnimationController(vsync: this, duration: const Duration(seconds: 5))
          ..repeat();
  }

  @override
  void dispose() {
    _animation.dispose();
    super.dispose();
  }

  CustomPainter _painter(double t) {
    switch (widget.symbolType) {
      case 'icosahedron':
        return _IcosahedronPainter(animation: t, state: widget.currentState);
      case 'sphere':
        return _SpherePainter(animation: t, state: widget.currentState);
      case 'pyramid':
        return _PyramidPainter(animation: t, state: widget.currentState);
      default:
        return _DiamondPainter(animation: t, state: widget.currentState);
    }
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: widget.onTap,
        child: AnimatedBuilder(
          animation: _animation,
          builder: (_, __) => CustomPaint(
            size: const Size(260, 260),
            painter: _painter(_animation.value),
          ),
        ),
      );
}
// ─── Painters ───────────────────────────────────────────────────────────────

// Shared glow helper
Paint _glowPaint(Color c, double opacity, double blur) => Paint()
  ..color = c.withOpacity(opacity)
  ..maskFilter = MaskFilter.blur(BlurStyle.normal, blur);

bool _basicRepaint(double a, double b, String s1, String s2) =>
    a != b || s1 != s2;

double _pulse(String state, double t) =>
    state == 'LISTENING' ? 1.12 + math.sin(t * math.pi * 6) * .06 : 1.0;

// ─── Diamond ────────────────────────────────────────────────────────────────
class _DiamondPainter extends CustomPainter {
  const _DiamondPainter({required this.animation, required this.state});
  final double animation;
  final String state;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final p = _pulse(state, animation);
    canvas.drawCircle(center, 105 * p,
        _glowPaint(const Color(0xFF9D5CFF), state == 'THINKING' ? .5 : .28, 28));
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate((animation - .5) * .20);
    canvas.scale(p);
    final top = Path()
      ..moveTo(0, -94)
      ..lineTo(91, -18)
      ..lineTo(0, 23)
      ..lineTo(-91, -18)
      ..close();
    final left = Path()
      ..moveTo(-91, -18)
      ..lineTo(0, 23)
      ..lineTo(0, 106)
      ..close();
    final right = Path()
      ..moveTo(91, -18)
      ..lineTo(0, 23)
      ..lineTo(0, 106)
      ..close();
    final bottom = Path()
      ..moveTo(-91, -18)
      ..lineTo(0, 106)
      ..lineTo(91, -18)
      ..lineTo(0, 23)
      ..close();
    canvas.drawPath(
        top,
        Paint()
          ..shader = const LinearGradient(
                  colors: [Color(0xFFFFFBFF), Color(0xFF9D5CFF)])
              .createShader(const Rect.fromLTWH(-92, -95, 184, 120)));
    canvas.drawPath(left, Paint()..color = const Color(0xFF6430C7));
    canvas.drawPath(right, Paint()..color = const Color(0xFF32106E));
    canvas.drawPath(bottom,
        Paint()..color = const Color(0xFF7B30EB).withOpacity(.78));
    canvas.drawLine(
        const Offset(0, -94),
        const Offset(0, 106),
        Paint()
          ..color = Colors.white.withOpacity(.45)
          ..strokeWidth = 2);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _DiamondPainter o) =>
      _basicRepaint(animation, o.animation, state, o.state);
}

// ─── Icosahedron / Quantum Crystal ──────────────────────────────────────────
class _IcosahedronPainter extends CustomPainter {
  const _IcosahedronPainter({required this.animation, required this.state});
  final double animation;
  final String state;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final p = _pulse(state, animation);
    canvas.drawCircle(Offset(cx, cy), 108 * p,
        _glowPaint(const Color(0xFF00E5FF), state == 'THINKING' ? .4 : .2, 32));
    canvas.save();
    canvas.translate(cx, cy);
    canvas.scale(p);

    final rot = animation * math.pi * 2;
    const r = 80.0;
    const pts = 6;
    final outerPts = List.generate(
        pts, (i) => Offset(r * math.cos(rot + i * math.pi * 2 / pts),
            r * math.sin(rot + i * math.pi * 2 / pts)));
    final innerPts = List.generate(
        pts,
        (i) => Offset(
            r * 0.5 * math.cos(rot + (i + .5) * math.pi * 2 / pts),
            r * 0.5 * math.sin(rot + (i + .5) * math.pi * 2 / pts)));

    final filmPaint = Paint()
      ..color = const Color(0xFF00E5FF).withOpacity(.18)
      ..style = PaintingStyle.fill;
    final edgePaint = Paint()
      ..color = const Color(0xFF00E5FF).withOpacity(.7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    for (int i = 0; i < pts; i++) {
      final next = (i + 1) % pts;
      final tri = Path()
        ..moveTo(outerPts[i].dx, outerPts[i].dy)
        ..lineTo(innerPts[i].dx, innerPts[i].dy)
        ..lineTo(outerPts[next].dx, outerPts[next].dy)
        ..close();
      canvas.drawPath(tri, filmPaint);
      canvas.drawPath(tri, edgePaint);
      final tri2 = Path()
        ..moveTo(innerPts[i].dx, innerPts[i].dy)
        ..lineTo(outerPts[next].dx, outerPts[next].dy)
        ..lineTo(innerPts[next].dx, innerPts[next].dy)
        ..close();
      canvas.drawPath(tri2, filmPaint..color = const Color(0xFF7B00FF).withOpacity(.15));
      canvas.drawPath(tri2, edgePaint..color = const Color(0xFF7B00FF).withOpacity(.6));
    }
    // Centre dot
    canvas.drawCircle(Offset.zero, 8,
        Paint()..color = Colors.white.withOpacity(.9));
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _IcosahedronPainter o) =>
      _basicRepaint(animation, o.animation, state, o.state);
}

// ─── Plasma Energy Sphere ────────────────────────────────────────────────────
class _SpherePainter extends CustomPainter {
  const _SpherePainter({required this.animation, required this.state});
  final double animation;
  final String state;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final p = _pulse(state, animation);
    const baseR = 88.0;

    // Outer glow
    canvas.drawCircle(Offset(cx, cy), baseR * p * 1.35,
        _glowPaint(const Color(0xFFFF1E42), state == 'THINKING' ? .45 : .22, 40));

    // Gradient sphere
    canvas.drawCircle(
        Offset(cx, cy),
        baseR * p,
        Paint()
          ..shader = RadialGradient(
            center: const Alignment(-0.3, -0.4),
            radius: 1,
            colors: state == 'SPEAKING'
                ? const [Color(0xFFFFFFFF), Color(0xFFFF1E42), Color(0xFF6B0020)]
                : const [Color(0xFFFF6B8A), Color(0xFFFF1E42), Color(0xFF3D0010)],
          ).createShader(Rect.fromCircle(center: Offset(cx, cy), radius: baseR * p)));

    // Orbiting ring
    canvas.save();
    canvas.translate(cx, cy);
    final ringAngle = animation * math.pi * 2;
    canvas.rotate(ringAngle);
    canvas.scale(1, 0.35);
    final ringPaint = Paint()
      ..color = Colors.white.withOpacity(.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawCircle(Offset.zero, baseR * p * 1.1, ringPaint);
    canvas.restore();

    // Highlight dot
    canvas.drawCircle(Offset(cx - baseR * p * .28, cy - baseR * p * .28), baseR * p * .14,
        Paint()..color = Colors.white.withOpacity(.6));
  }

  @override
  bool shouldRepaint(covariant _SpherePainter o) =>
      _basicRepaint(animation, o.animation, state, o.state);
}

// ─── Imperial Gold Prism / Pyramid ──────────────────────────────────────────
class _PyramidPainter extends CustomPainter {
  const _PyramidPainter({required this.animation, required this.state});
  final double animation;
  final String state;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final p = _pulse(state, animation);

    canvas.drawCircle(Offset(cx, cy), 110 * p,
        _glowPaint(const Color(0xFFFFD700), state == 'THINKING' ? .4 : .18, 36));

    canvas.save();
    canvas.translate(cx, cy);
    final rot = (animation - .5) * .25;
    canvas.rotate(rot);
    canvas.scale(p);

    const h = 90.0;
    const hw = 80.0;
    const bh = 60.0;

    // Base square (perspective top)
    final baseCorners = [
      Offset(-hw, bh),
      Offset(hw, bh),
      Offset(hw * .6, bh * .5),
      Offset(-hw * .6, bh * .5),
    ];
    final base = Path()
      ..moveTo(baseCorners[0].dx, baseCorners[0].dy)
      ..lineTo(baseCorners[1].dx, baseCorners[1].dy)
      ..lineTo(baseCorners[2].dx, baseCorners[2].dy)
      ..lineTo(baseCorners[3].dx, baseCorners[3].dy)
      ..close();
    canvas.drawPath(
        base,
        Paint()
          ..shader = const LinearGradient(
                  colors: [Color(0xFFB8860B), Color(0xFFFFD700)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight)
              .createShader(const Rect.fromLTWH(-hw, 0, hw * 2, bh)));

    // Front face
    final front = Path()
      ..moveTo(-hw, bh)
      ..lineTo(hw, bh)
      ..lineTo(0, -h)
      ..close();
    canvas.drawPath(
        front,
        Paint()
          ..shader = LinearGradient(
                  colors: [const Color(0xFFFFD700), const Color(0xFFFF8C00).withOpacity(.8)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter)
              .createShader(Rect.fromLTWH(-hw, -h, hw * 2, h + bh)));

    // Left face
    final leftFace = Path()
      ..moveTo(-hw, bh)
      ..lineTo(-hw * .6, bh * .5)
      ..lineTo(0, -h)
      ..close();
    canvas.drawPath(leftFace, Paint()..color = const Color(0xFFB8860B).withOpacity(.8));

    // Right face
    final rightFace = Path()
      ..moveTo(hw, bh)
      ..lineTo(hw * .6, bh * .5)
      ..lineTo(0, -h)
      ..close();
    canvas.drawPath(rightFace, Paint()..color = const Color(0xFFDAA520).withOpacity(.6));

    // Apex highlight
    canvas.drawCircle(const Offset(0, -h), 5,
        Paint()..color = Colors.white.withOpacity(.85));

    // Edge lines
    final edge = Paint()
      ..color = Colors.white.withOpacity(.3)
      ..strokeWidth = 1;
    for (final corner in baseCorners) {
      canvas.drawLine(const Offset(0, -h), corner, edge);
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _PyramidPainter o) =>
      _basicRepaint(animation, o.animation, state, o.state);
}
