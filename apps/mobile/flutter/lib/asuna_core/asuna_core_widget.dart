import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Animated diamond core shared visually with the web HUD's diamond mode.
class AsunaCoreWidget extends StatefulWidget {
  const AsunaCoreWidget({super.key, required this.currentState});
  final String currentState;
  @override
  State<AsunaCoreWidget> createState() => _AsunaCoreWidgetState();
}

class _AsunaCoreWidgetState extends State<AsunaCoreWidget> with SingleTickerProviderStateMixin {
  late final AnimationController _animation;
  @override
  void initState() { super.initState(); _animation = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat(); }
  @override
  void dispose() { _animation.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => AnimatedBuilder(animation: _animation, builder: (_, __) => CustomPaint(size: const Size(260, 260), painter: _DiamondPainter(animation: _animation.value, state: widget.currentState)));
}

class _DiamondPainter extends CustomPainter {
  const _DiamondPainter({required this.animation, required this.state});
  final double animation;
  final String state;
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final pulse = state == 'LISTENING' ? 1.12 + math.sin(animation * math.pi * 6) * .06 : 1.0;
    canvas.drawCircle(center, 105 * pulse, Paint()..color = const Color(0xFF9D5CFF).withOpacity(state == 'THINKING' ? .5 : .28)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 28));
    canvas.save(); canvas.translate(center.dx, center.dy); canvas.rotate((animation - .5) * .20); canvas.scale(pulse);
    final top = Path()..moveTo(0, -94)..lineTo(91, -18)..lineTo(0, 23)..lineTo(-91, -18)..close();
    final left = Path()..moveTo(-91, -18)..lineTo(0, 23)..lineTo(0, 106)..close();
    final right = Path()..moveTo(91, -18)..lineTo(0, 23)..lineTo(0, 106)..close();
    final bottom = Path()..moveTo(-91, -18)..lineTo(0, 106)..lineTo(91, -18)..lineTo(0, 23)..close();
    canvas.drawPath(top, Paint()..shader = const LinearGradient(colors: [Color(0xFFFFFBFF), Color(0xFF9D5CFF)]).createShader(const Rect.fromLTWH(-92, -95, 184, 120)));
    canvas.drawPath(left, Paint()..color = const Color(0xFF6430C7));
    canvas.drawPath(right, Paint()..color = const Color(0xFF32106E));
    canvas.drawPath(bottom, Paint()..color = const Color(0xFF7B30EB).withOpacity(.78));
    canvas.drawLine(const Offset(0, -94), const Offset(0, 106), Paint()..color = Colors.white.withOpacity(.45)..strokeWidth = 2);
    canvas.restore();
  }
  @override
  bool shouldRepaint(covariant _DiamondPainter oldDelegate) => oldDelegate.animation != animation || oldDelegate.state != state;
}
