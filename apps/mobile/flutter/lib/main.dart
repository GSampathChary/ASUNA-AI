import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'asuna_core/asuna_core_widget.dart';
import 'gestures/hand_control_panel.dart';
import 'screens/onboarding/onboarding_gate.dart';
import 'services/api_service.dart';
import 'services/native_device_service.dart';
import 'services/permission_service.dart';
import 'services/remote_agent_service.dart';
import 'services/voice_service.dart';
import 'widgets/eye_tracking_character.dart';
void main() => runApp(const AsunaApp());

class AsunaApp extends StatelessWidget {
  const AsunaApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Asuna-AI',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          brightness: Brightness.dark,
          colorSchemeSeed: const Color(0xFFFF1E42),
          scaffoldBackgroundColor: const Color(0xFF090817),
        ),
        home: const AsunaRootScreen(),
      );
}

// ─── Root: decides whether to show onboarding or main screen ─────────────────

class AsunaRootScreen extends StatefulWidget {
  const AsunaRootScreen({super.key});
  @override
  State<AsunaRootScreen> createState() => _AsunaRootScreenState();
}

class _AsunaRootScreenState extends State<AsunaRootScreen> {
  bool _loading = true;
  bool _onboarded = false;
  String _email = '';
  String _nickname = '';
  String _voiceSlang = 'us_slang';
  String _symbolType = 'diamond';

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _onboarded = prefs.getBool('onboarding_complete') ?? false;
      _email = prefs.getString('user_email') ?? '';
      _nickname = prefs.getString('user_nickname') ?? '';
      _voiceSlang = prefs.getString('voice_slang') ?? 'us_slang';
      _symbolType = prefs.getString('symbol_type') ?? 'diamond';
      _loading = false;
    });
  }

  Future<void> _handleUnlock({
    required String email,
    required String nickname,
    required String voiceSlang,
    required String symbolType,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_complete', true);
    await prefs.setString('user_email', email);
    await prefs.setString('user_nickname', nickname);
    await prefs.setString('voice_slang', voiceSlang);
    await prefs.setString('symbol_type', symbolType);
    setState(() {
      _onboarded = true;
      _email = email;
      _nickname = nickname;
      _voiceSlang = voiceSlang;
      _symbolType = symbolType;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (!_onboarded) {
      return OnboardingGate(onUnlock: _handleUnlock);
    }
    return AsunaHomeScreen(
      email: _email,
      nickname: _nickname,
      voiceSlang: _voiceSlang,
      symbolType: _symbolType,
    );
  }
}

// ─── Chat Message Model ───────────────────────────────────────────────────────

class _ChatMessage {
  _ChatMessage(this.text, this.isUser, {String? time})
      : time = time ?? _now();

  final String text;
  final bool isUser;
  final String time;

  static String _now() {
    final t = DateTime.now();
    final h = t.hour.toString().padLeft(2, '0');
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

// ─── Main Home Screen ─────────────────────────────────────────────────────────

class AsunaHomeScreen extends StatefulWidget {
  const AsunaHomeScreen({
    super.key,
    required this.email,
    required this.nickname,
    required this.voiceSlang,
    required this.symbolType,
  });

  final String email;
  final String nickname;
  final String voiceSlang;
  final String symbolType;

  @override
  State<AsunaHomeScreen> createState() => _AsunaHomeScreenState();
}

class _AsunaHomeScreenState extends State<AsunaHomeScreen> {
  static const _defaultApi = 'https://asuna-ai-7xaz.onrender.com';
  static const _defaultGateway = 'wss://asuna-ai-7xaz.onrender.com/ws';
  static const _crimson = Color(0xFFFF1E42);

  final _composer = TextEditingController();
  final _permissions = PermissionService();
  late final VoiceService _voice;
  late String _email;
  late String _nickname;
  late String _symbolType;
  String _apiUrl = _defaultApi;
  String _state = 'IDLE';
  String _statusText = 'Asuna online';
  String _voiceText = '';
  String _targetDevice = 'local'; // local | laptop | mobile
  bool _sending = false;
  bool _listening = false;
  bool _permissionsRequested = false;
  List<Map<String, dynamic>> _connectedDevices = [];
  double? _speechRate;
  bool _voiceOnly = false;
  bool _characterVisible = true;

  late final RemoteAgentService _remoteAgent;
  late final List<_ChatMessage> _messages;
  final _scrollKey = GlobalKey<AnimatedListState>();
  final _listController = ScrollController();

  @override
  void initState() {
    super.initState();
    _email = widget.email;
    _nickname = widget.nickname;
    _symbolType = widget.symbolType;
    _voice = VoiceService();
    _messages = [_ChatMessage(_welcomeText, false)];
    _remoteAgent = RemoteAgentService(NativeDeviceService())
      ..onStatus = (v) {
        if (mounted)
          setState(() => _state =
              v == 'Paired and online' ? 'CONNECTED' : _state);
      }
      ..onEvent = _showNotice;
    _initialize();
  }

  String get _welcomeText =>
      'Hello${_nickname.isNotEmpty ? ", $_nickname" : ""}. Asuna is online. Pair this device to enable cross-device commands.';

  Future<void> _initialize() async {
    final granted = await _permissions.requestRequiredPermissions();
    if (!mounted) return;
    setState(() => _permissionsRequested = true);
    // Load persisted voice settings
    final prefs = await SharedPreferences.getInstance();
    _speechRate = double.tryParse(prefs.getString('voice_rate') ?? '0.48') ?? 0.48;
    _voiceOnly = prefs.getBool('voice_only') ?? false;
    await _voice.initialize(onError: _showNotice);
    await _voice.setSpeechRate(_speechRate!);
    final denied = granted.entries
        .where((e) => e.value != PermissionStatus.granted)
        .map((e) => e.key.toString().split('.').last)
        .toList();
    if (denied.isNotEmpty) {
      _showNotice(
          'Some features need permission: ${denied.join(', ')}. Enable in Settings.');
    }
  }

  void _showNotice(String text) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), duration: const Duration(seconds: 4)),
    );
  }

  Future<void> _send(String raw) async {
    final message = raw.trim();
    if (message.isEmpty || _sending) return;
    setState(() {
      _messages.add(_ChatMessage(message, true));
      if (!_voiceOnly) {
        _messages.add(_ChatMessage('Asuna is processing…', false));
      }
      _sending = true;
      _state = 'THINKING';
      _statusText = 'Processing…';
      _composer.clear();
    });
    _scrollToBottom();

    final pendingIndex = _messages.length - 1;

    try {
      final reply = await ApiService(_apiUrl).sendChat(
        message: message,
        email: _email.isNotEmpty ? _email : 'mobile@asuna.ai',
        userNickname: _nickname,
        targetDevice: _targetDevice,
        history: _messages
            .where((m) => !m.text.contains('processing…'))
            .map((m) => {'role': m.isUser ? 'user' : 'assistant', 'content': m.text})
            .cast<Map<String, String>>()
            .toList(),
        sessionToken: _remoteAgent.sessionToken,
        onRetry: (attempt, msg) {
          if (mounted) setState(() => _statusText = msg);
        },
      );
      if (!mounted) return;
      setState(() {
        if (!_voiceOnly) {
          _messages[pendingIndex] = _ChatMessage(reply, false);
        }
        _state = 'SPEAKING';
        _statusText = 'Asuna online';
      });
      await _voice.speak(reply);
    } catch (error) {
      if (mounted) {
        setState(() {
          _messages[pendingIndex] = _ChatMessage(
            'I could not reach Asuna-AI${_nickname.isNotEmpty ? ", $_nickname" : ""}: $error',
            false,
          );
          _state = 'ERROR';
          _statusText = 'Gateway offline';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _sending = false);
        Future<void>.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() { _state = 'IDLE'; _statusText = 'Asuna online'; });
        });
      }
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_listController.hasClients) {
        _listController.animateTo(
          _listController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _toggleVoice() async {
    if (_voice.isListening) {
      await _voice.stop();
      if (mounted) setState(() { _listening = false; _state = 'IDLE'; _statusText = 'Asuna online'; });
      return;
    }
    try {
      setState(() { _listening = true; _state = 'LISTENING'; _voiceText = 'Listening…'; _statusText = 'Listening…'; });
      await _voice.listen((words, isFinal) {
        if (!mounted) return;
        setState(() => _voiceText = words);
        if (isFinal && words.trim().isNotEmpty) {
          final command = words
              .replaceFirst(
                  RegExp(r'^\s*(hey\s+)?asuna(?:\s+ai)?[,:]?\s*', caseSensitive: false), '')
              .trim();
          _send(command.isEmpty ? words : command);
          setState(() { _listening = false; _voiceText = ''; });
        }
      });
    } catch (e) { _showNotice('$e'); }
  }

  Future<void> _pairDevice() async {
    final gateway = TextEditingController(text: _defaultGateway);
    final emailCtrl = TextEditingController(text: _email);
    final token = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18070B),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Colors.white54)),
        title: const Text('🔗 Pair this Android device',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            _dialogField(gateway, 'WebSocket gateway', TextInputType.url),
            const SizedBox(height: 10),
            _dialogField(emailCtrl, 'Account email', TextInputType.emailAddress),
            const SizedBox(height: 10),
            _dialogField(token, 'Pairing token', TextInputType.text, obscure: true),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              try {
                await _remoteAgent.connect(
                  websocketUrl: gateway.text.trim(),
                  email: emailCtrl.text.trim(),
                  pairingToken: token.text.trim(),
                  deviceId: 'android_${DateTime.now().millisecondsSinceEpoch}',
                );
                if (ctx.mounted) Navigator.pop(ctx);
              } catch (e) { if (mounted) _showNotice('$e'); }
            },
            child: const Text('Pair'),
          ),
        ],
      ),
    );
    gateway.dispose(); emailCtrl.dispose(); token.dispose();
  }

  Future<void> _editProfile() async {
    final emailCtrl = TextEditingController(text: _email);
    final nicknameCtrl = TextEditingController(text: _nickname);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18070B),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Colors.white54)),
        title: const Text('👤 Edit Profile',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          _dialogField(emailCtrl, 'Account email', TextInputType.emailAddress),
          const SizedBox(height: 10),
          _dialogField(nicknameCtrl, 'Nickname', TextInputType.name),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final newEmail = emailCtrl.text.trim();
              final newNick = nicknameCtrl.text.trim();
              if (newEmail.isEmpty || !newEmail.contains('@')) return;
              final prefs = await SharedPreferences.getInstance();
              await prefs.setString('user_email', newEmail);
              await prefs.setString('user_nickname', newNick);
              if (mounted) {
                setState(() {
                  _email = newEmail;
                  _nickname = newNick;
                  _messages.add(_ChatMessage(
                    'Hello${newNick.isNotEmpty ? ", $newNick" : ""}. Asuna is online.',
                    false,
                  ));
                });
                Navigator.pop(ctx);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
    emailCtrl.dispose(); nicknameCtrl.dispose();
  }

  Future<void> _showDevices() async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18070B),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Colors.white54)),
        title: const Text('🌐 Connected Devices',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: _connectedDevices.isEmpty
            ? const Text(
                '• Android (Current)\n• Laptop Agent (Offline — run agents/windows/main.py)',
                style: TextStyle(color: Colors.white70))
            : Column(
                mainAxisSize: MainAxisSize.min,
                children: _connectedDevices
                    .map((d) => Text(
                          '• ${(d["device_type"] as String? ?? "device").toUpperCase()} (${d["status"] ?? "?"})',
                          style: const TextStyle(color: Colors.white70)))
                    .toList()),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close'))],
      ),
    );
  }

  Future<void> _settings() async {
    final api = TextEditingController(text: _apiUrl);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18070B),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Colors.white54)),
        title: const Text('⚙️ Asuna-AI Settings',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _dialogField(api, 'Backend API URL', TextInputType.url),
            const SizedBox(height: 10),
            // Speech rate slider
            Row(
              children: [
                const Text('Speech Speed', style: TextStyle(color: Colors.white70)),
                Expanded(
                  child: Slider(
                    min: 0.3,
                    max: 1.0,
                    divisions: 7,
                    value: _speechRate ?? 0.48,
                    label: (_speechRate ?? 0.48).toStringAsFixed(2),
                    onChanged: (v) async {
                      setState(() => _speechRate = v);
                      await _voice.setSpeechRate(v);
                      final prefs = await SharedPreferences.getInstance();
                      await prefs.setString('voice_rate', v.toString());
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Voice‑only toggle
            Row(
              children: [
                const Text('Voice‑Only Replies', style: TextStyle(color: Colors.white70)),
                Switch.adaptive(
                  value: _voiceOnly,
                  onChanged: (v) async {
                    setState(() => _voiceOnly = v);
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.setBool('voice_only', v);
                  },
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Character visibility toggle
            Row(
              children: [
                const Text('Show Anime Character', style: TextStyle(color: Colors.white70)),
                Switch.adaptive(
                  value: _characterVisible,
                  onChanged: (v) async {
                    setState(() => _characterVisible = v);
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.setBool('show_character', v);
                  },
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: _permissions.openSettings, child: const Text('App Permissions')),
          FilledButton(
            onPressed: () {
              setState(() => _apiUrl = api.text.trim());
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
    api.dispose();
    return;
  }
    final api = TextEditingController(text: _apiUrl);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18070B),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Colors.white54)),
        title: const Text('⚙️ Asuna-AI Settings',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _dialogField(api, 'Backend API URL', TextInputType.url),
            const SizedBox(height: 10),
            // Speech rate slider
            Row(
              children: [
                const Text('Speech Speed', style: TextStyle(color: Colors.white70)),
                Expanded(
                  child: Slider(
                    min: 0.3,
                    max: 1.0,
                    divisions: 7,
                    value: _speechRate ?? 0.48,
                    label: (_speechRate ?? 0.48).toStringAsFixed(2),
                    onChanged: (v) async {
                      setState(() => _speechRate = v);
                      await _voice.setSpeechRate(v);
                      final prefs = await SharedPreferences.getInstance();
                      await prefs.setString('voice_rate', v.toString());
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Voice‑only toggle
            Row(
              children: [
                const Text('Voice‑Only Replies', style: TextStyle(color: Colors.white70)),
                Switch.adaptive(
                  value: _voiceOnly,
                  onChanged: (v) async {
                    setState(() => _voiceOnly = v);
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.setBool('voice_only', v);
                  },
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: _permissions.openSettings, child: const Text('App Permissions')),
          FilledButton(
            onPressed: () {
              setState(() => _apiUrl = api.text.trim());
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
    api.dispose();
  }

  Widget _dialogField(TextEditingController c, String label, TextInputType kb,
          {bool obscure = false}) =>
      TextField(
        controller: c,
        keyboardType: kb,
        obscureText: obscure,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Colors.white60),
          enabledBorder: const OutlineInputBorder(
              borderSide: BorderSide(color: Colors.white38)),
          focusedBorder: const OutlineInputBorder(
              borderSide: BorderSide(color: _crimson, width: 2)),
          filled: true,
          fillColor: const Color(0xFF2B0D14),
        ),
      );

  Color get _stateColor {
    switch (_state) {
      case 'THINKING': return Colors.amber;
      case 'LISTENING': return Colors.greenAccent;
      case 'SPEAKING': return const Color(0xFF4ADE80);
      case 'CONNECTED': return Colors.cyanAccent;
      case 'ERROR': return _crimson;
      default: return Colors.white54;
    }
  }

  @override
  void dispose() {
    _composer.dispose();
    _voice.dispose();
    _remoteAgent.disconnect();
    _listController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isPaired = _remoteAgent.status == 'Paired and online';
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0510),
        elevation: 0,
        title: Row(children: [
          CustomPaint(size: const Size(22, 22), painter: _AppBarDiamondPainter()),
          const SizedBox(width: 8),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('ASUNA OS',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
            Text(
              _nickname.isNotEmpty
                  ? 'ASUNA NEURAL NET · ${_nickname.toUpperCase()}'
                  : 'ASUNA NEURAL NET',
              style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8), letterSpacing: 0.5),
            ),
          ]),
        ]),
        actions: [
          // Profile
          TextButton.icon(
            onPressed: _editProfile,
            icon: const Icon(Icons.person_outline, size: 16, color: Colors.white70),
            label: Text(
              _nickname.isNotEmpty ? _nickname : 'Set profile',
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ),
          // Pair
          IconButton(
            onPressed: _pairDevice,
            icon: Icon(isPaired ? Icons.link : Icons.link_off,
                color: isPaired ? Colors.greenAccent : Colors.white54),
            tooltip: isPaired ? 'Paired ✓' : 'Pair device',
          ),
          // Devices
          IconButton(
            onPressed: _showDevices,
            icon: Badge(
              label: Text('${_connectedDevices.length > 0 ? _connectedDevices.length : 1}'),
              child: const Icon(Icons.devices, color: Colors.white70),
            ),
            tooltip: 'Devices',
          ),
          // Settings
          IconButton(
            onPressed: _settings,
            icon: const Icon(Icons.settings, color: Colors.white54),
            tooltip: 'Settings',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(children: [
          // Status bar
          Container(
            color: const Color(0xFF0F0510),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(children: [
              Container(
                width: 8, height: 8,
                decoration: BoxDecoration(
                  color: _stateColor,
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: _stateColor.withOpacity(.6), blurRadius: 6)],
                ),
              ),
              const SizedBox(width: 8),
              Text(_statusText,
                  style: TextStyle(fontSize: 11, color: _stateColor, fontWeight: FontWeight.w600)),
              const Spacer(),
              Text(_email.isNotEmpty ? _email : 'Account: Not set',
                  style: const TextStyle(fontSize: 10, color: Color(0xFF475569))),
            ]),
          ),
          if (characterVisible) const EyeTrackingCharacter(),
const Divider(height: 1, color: Color(0xFF1E0A0F)),

          // 3D Core
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: AsunaCoreWidget(
              currentState: _listening ? 'LISTENING' : _state,
              symbolType: _symbolType,
              onTap: _sending ? null : _toggleVoice,
            ),
          ),

          // Voice transcript
          if (_voiceText.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
              child: Text(_voiceText,
                  maxLines: 2,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF4ADE80))),
            ),

          // Target device selector
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(children: [
              const Text('Target:',
                  style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
              const SizedBox(width: 8),
              ...[
                ('local', '⚡ Auto'),
                ('laptop', '💻 Laptop'),
                ('mobile', '📱 Mobile'),
              ].map((pair) {
                final (val, label) = pair;
                final active = _targetDevice == val;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap: () => setState(() => _targetDevice = val),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: active ? _crimson : const Color(0xFF2B0D14),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: active ? _crimson : Colors.white24),
                      ),
                      child: Text(label,
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: active ? Colors.white : Colors.white54)),
                    ),
                  ),
                );
              }),
              const Spacer(),
              // Voice / Hand controls
              GestureDetector(
                onTap: _toggleVoice,
                child: Icon(
                  _listening ? Icons.stop_circle_outlined : Icons.mic_none,
                  color: _listening ? Colors.greenAccent : Colors.white54,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => HandControlPanel(
                      onGesture: (g) {
                        if (g == 'PINCH') _send(_composer.text);
                        else _showNotice('Two-finger gesture detected.');
                      },
                      onClose: () => Navigator.pop(context),
                    ),
                  ),
                ),
                child: const Icon(Icons.pan_tool_outlined, color: Colors.white54, size: 22),
              ),
            ]),
          ),
          const Divider(height: 1, color: Color(0xFF1E0A0F)),

          // NEURAL NET header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(
                  _nickname.isNotEmpty
                      ? 'ASUNA NEURAL NET · ${_nickname.toUpperCase()}'
                      : 'ASUNA NEURAL NET',
                  style: const TextStyle(fontSize: 9, color: Color(0xFF64748B), fontWeight: FontWeight.w700, letterSpacing: 0.8),
                ),
                Text(_statusText,
                    style: const TextStyle(fontSize: 13, color: Colors.white, fontWeight: FontWeight.bold)),
              ]),
              const Spacer(),
              // Thinking indicator
              if (_sending)
                const SizedBox(
                  width: 14, height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: _crimson),
                ),
            ]),
          ),

          // Chat messages
          Expanded(
            child: ListView.builder(
              controller: _listController,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              itemCount: _messages.length,
              itemBuilder: (_, i) {
                final msg = _messages[i];
                return Align(
                  alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
                    constraints: const BoxConstraints(maxWidth: 320),
                    decoration: BoxDecoration(
                      color: msg.isUser
                          ? const Color(0xFF4A0015)
                          : const Color(0xFF1A0A10),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: msg.isUser
                            ? const Radius.circular(16)
                            : const Radius.circular(4),
                        bottomRight: msg.isUser
                            ? const Radius.circular(4)
                            : const Radius.circular(16),
                      ),
                      border: Border.all(
                        color: msg.isUser
                            ? _crimson.withOpacity(.4)
                            : Colors.white12,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: msg.isUser
                          ? CrossAxisAlignment.end
                          : CrossAxisAlignment.start,
                      children: [
                        Text(msg.text,
                            style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4)),
                        const SizedBox(height: 4),
                        Text(msg.time,
                            style: const TextStyle(fontSize: 9, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Privacy note
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            child: Text(
              'Remote execution requires a paired device.${_nickname.isNotEmpty ? "  Profile: $_nickname" : ""}',
              style: const TextStyle(fontSize: 9, color: Color(0xFF334155)),
              textAlign: TextAlign.center,
            ),
          ),

          // Composer
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _composer,
                  onSubmitted: _send,
                  textInputAction: TextInputAction.send,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: "Say 'Asuna, open YouTube on my laptop'…",
                    hintStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
                    filled: true,
                    fillColor: const Color(0xFF1A0A10),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: const BorderSide(color: Colors.white12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: const BorderSide(color: _crimson, width: 1.5),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _sending ? null : () => _send(_composer.text),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: _sending ? Colors.white12 : _crimson,
                    shape: BoxShape.circle,
                    boxShadow: _sending
                        ? []
                        : const [BoxShadow(color: Color(0x55FF1E42), blurRadius: 12)],
                  ),
                  child: _sending
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70))
                      : const Icon(Icons.send, color: Colors.white, size: 20),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

// Small diamond icon for the AppBar
class _AppBarDiamondPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final path = Path()
      ..moveTo(cx, 1)
      ..lineTo(size.width - 1, cy)
      ..lineTo(cx, size.height - 1)
      ..lineTo(1, cy)
      ..close();
    canvas.drawPath(path, Paint()..color = const Color(0xFFFF1E42));
    final inner = Path()
      ..moveTo(cx, cy - 4)
      ..lineTo(cx + 5, cy)
      ..lineTo(cx, cy + 4)
      ..lineTo(cx - 5, cy)
      ..close();
    canvas.drawPath(inner, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant CustomPainter _) => false;
}
