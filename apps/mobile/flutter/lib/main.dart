import 'package:flutter/material.dart';
import 'asuna_core/asuna_core_widget.dart';

void main() {
  runApp(const AsunaApp());
}

class AsunaApp extends StatelessWidget {
  const AsunaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Asuna AI — Red & Gold',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0D0406),
        primaryColor: const Color(0xFFFFD700),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFFD700),
          secondary: Color(0xFFFF1E42),
          surface: Color(0xFF1A080C),
        ),
      ),
      home: const AsunaHomeScreen(),
    );
  }
}

class AsunaHomeScreen extends StatefulWidget {
  const AsunaHomeScreen({super.key});

  @override
  State<AsunaHomeScreen> createState() => _AsunaHomeScreenState();
}

class _AsunaHomeScreenState extends State<AsunaHomeScreen> {
  String _currentState = 'IDLE';
  String _gestureMode = 'GESTURE_MODE';
  bool _isListening = false;
  String _lastCommand = 'Say "Asuna YouTube open cheyyi" or use gestures...';
  final List<String> _eventLog = [
    'System Initialized',
    'Asuna Core 3D Red & Gold Engine: Active',
    'Gesture Engine: Ready'
  ];

  void _toggleListening() {
    setState(() {
      _isListening = !_isListening;
      _currentState = _isListening ? 'LISTENING' : 'IDLE';
      _eventLog.insert(0, _isListening ? 'Voice Session: Started' : 'Voice Session: Paused');
    });
  }

  void _toggleGestureMode() {
    setState(() {
      if (_gestureMode == 'GESTURE_MODE') {
        _gestureMode = 'PAUSED_MODE';
        _currentState = 'PAUSED';
      } else {
        _gestureMode = 'GESTURE_MODE';
        _currentState = 'IDLE';
      }
      _eventLog.insert(0, 'Gesture Mode: $_gestureMode');
    });
  }

  void _simulateGesture(String gestureName) {
    setState(() {
      if (gestureName == 'PINCH') {
        _currentState = 'CLICKING';
        _eventLog.insert(0, 'Gesture: PINCH -> Click Action');
      } else if (gestureName == 'TWO_FINGER_UP') {
        _currentState = 'SCROLLING';
        _eventLog.insert(0, 'Gesture: TWO_FINGER_UP -> Scroll Up');
      } else if (gestureName == 'ZOOM_IN') {
        _currentState = 'ZOOMING_IN';
        _eventLog.insert(0, 'Gesture: ZOOM_IN -> Scale 1.25x');
      }
    });

    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() {
          _currentState = 'IDLE';
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.diamond_outlined, color: Color(0xFFFFD700)),
            SizedBox(width: 8),
            Text(
              'ASUNA AI',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
                color: Color(0xFFFFD700),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF1A080C),
        elevation: 4,
        actions: [
          IconButton(
            icon: Icon(
              _gestureMode == 'GESTURE_MODE' ? Icons.pan_tool : Icons.pan_tool_outlined,
              color: _gestureMode == 'GESTURE_MODE' ? const Color(0xFFFFD700) : Colors.grey,
            ),
            onPressed: _toggleGestureMode,
            tooltip: 'Toggle Gesture Mode',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF1A080C),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFFFD700).withOpacity(0.5)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Color(0xFFFFD700),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'STATE: $_currentState',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFFFD700),
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),

            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  AsunaCoreWidget(currentState: _currentState),
                  if (_gestureMode == 'GESTURE_MODE')
                    Positioned(
                      bottom: 10,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFFFD700), width: 0.5),
                        ),
                        child: const Text(
                          'RETICLE: ACTIVE',
                          style: TextStyle(fontSize: 10, color: Color(0xFFFFD700)),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const Spacer(),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Wrap(
                spacing: 8,
                children: [
                  ActionChip(
                    avatar: const Icon(Icons.touch_app, size: 16, color: Color(0xFFFFD700)),
                    label: const Text('Pinch Click'),
                    backgroundColor: const Color(0xFF1A080C),
                    onPressed: () => _simulateGesture('PINCH'),
                  ),
                  ActionChip(
                    avatar: const Icon(Icons.unfold_more, size: 16, color: Color(0xFFFFD700)),
                    label: const Text('Scroll'),
                    backgroundColor: const Color(0xFF1A080C),
                    onPressed: () => _simulateGesture('TWO_FINGER_UP'),
                  ),
                  ActionChip(
                    avatar: const Icon(Icons.zoom_in, size: 16, color: Color(0xFFFFD700)),
                    label: const Text('Zoom In'),
                    backgroundColor: const Color(0xFF1A080C),
                    onPressed: () => _simulateGesture('ZOOM_IN'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1A080C),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFFD700).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.graphic_eq, color: Color(0xFFFFD700)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _lastCommand,
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: GestureDetector(
                onTap: _toggleListening,
                child: CircleAvatar(
                  radius: 34,
                  backgroundColor: _isListening
                      ? Colors.redAccent
                      : const Color(0xFFFFD700),
                  child: Icon(
                    _isListening ? Icons.mic : Icons.mic_none,
                    color: Colors.black,
                    size: 32,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
