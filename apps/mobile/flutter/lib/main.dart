import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'asuna_core/asuna_core_widget.dart';
import 'gestures/hand_control_panel.dart';
import 'services/api_service.dart';
import 'services/native_device_service.dart';
import 'services/permission_service.dart';
import 'services/remote_agent_service.dart';
import 'services/voice_service.dart';

void main() => runApp(const AsunaApp());

class AsunaApp extends StatelessWidget {
  const AsunaApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Asuna-AI',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(useMaterial3: true, brightness: Brightness.dark, colorSchemeSeed: const Color(0xFF9D5CFF), scaffoldBackgroundColor: const Color(0xFF090817)),
        home: const AsunaHomeScreen(),
      );
}

class _ChatMessage {
  const _ChatMessage(this.text, this.isUser);
  final String text;
  final bool isUser;
}

class AsunaHomeScreen extends StatefulWidget {
  const AsunaHomeScreen({super.key});
  @override
  State<AsunaHomeScreen> createState() => _AsunaHomeScreenState();
}

class _AsunaHomeScreenState extends State<AsunaHomeScreen> {
  static const _defaultApi = 'https://asuna-ai-7xaz.onrender.com';
  static const _defaultGateway = 'wss://asuna-ai-7xaz.onrender.com/ws';
  final _composer = TextEditingController();
  final _permissions = PermissionService();
  final _voice = VoiceService();
  final List<_ChatMessage> _messages = [const _ChatMessage('Hello. I am Asuna-AI. Type a message or tap the microphone to speak.', false)];
  late final RemoteAgentService _remoteAgent;
  String _apiUrl = _defaultApi;
  String _state = 'IDLE';
  String _voiceText = '';
  bool _sending = false;
  bool _listening = false;
  bool _permissionsRequested = false;

  @override
  void initState() {
    super.initState();
    _remoteAgent = RemoteAgentService(NativeDeviceService())
      ..onStatus = (value) { if (mounted) setState(() => _state = value == 'Paired and online' ? 'CONNECTED' : 'IDLE'); }
      ..onEvent = (value) { if (mounted) _showNotice(value); };
    _initialize();
  }

  Future<void> _initialize() async {
    final granted = await _permissions.requestRequiredPermissions();
    if (!mounted) return;
    setState(() => _permissionsRequested = true);
    await _voice.initialize(onError: _showNotice);
    final denied = granted.entries.where((entry) => entry.value != PermissionStatus.granted).map((entry) => entry.key.toString().split('.').last).toList();
    if (denied.isNotEmpty) _showNotice('Some features need permission: ${denied.join(', ')}. You can enable them in Settings.');
  }

  void _showNotice(String text) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text), duration: const Duration(seconds: 4)));
  }

  Future<void> _send(String raw) async {
    final message = raw.trim();
    if (message.isEmpty || _sending) return;
    setState(() { _messages.add(_ChatMessage(message, true)); _sending = true; _state = 'THINKING'; _composer.clear(); });
    try {
      final reply = await ApiService(_apiUrl).sendChat(
        message: message,
        email: _remoteAgent.email ?? 'mobile@asuna.ai',
        history: _messages.where((item) => item.text != message).map((item) => {'role': item.isUser ? 'user' : 'assistant', 'content': item.text}).toList(),
        sessionToken: _remoteAgent.sessionToken,
      );
      if (!mounted) return;
      setState(() { _messages.add(_ChatMessage(reply, false)); _state = 'SPEAKING'; });
      await _voice.speak(reply);
    } catch (error) {
      if (mounted) setState(() => _messages.add(_ChatMessage('I could not reach Asuna-AI: $error', false)));
    } finally {
      if (mounted) setState(() { _sending = false; _state = 'IDLE'; });
    }
  }

  Future<void> _toggleVoice() async {
    if (_voice.isListening) {
      await _voice.stop();
      if (mounted) setState(() { _listening = false; _state = 'IDLE'; });
      return;
    }
    try {
      setState(() { _listening = true; _state = 'LISTENING'; _voiceText = 'Listening…'; });
      await _voice.listen((words, isFinal) {
        if (!mounted) return;
        setState(() => _voiceText = words);
        if (isFinal && words.trim().isNotEmpty) {
          final command = words.replaceFirst(RegExp(r'^\s*(hey\s+)?asuna(?:\s+ai)?[,:]?\s*', caseSensitive: false), '').trim();
          _send(command.isEmpty ? words : command);
          setState(() => _listening = false);
        }
      });
    } catch (error) { _showNotice('$error'); }
  }

  Future<void> _pairDevice() async {
    final gateway = TextEditingController(text: _defaultGateway);
    final email = TextEditingController();
    final token = TextEditingController();
    await showDialog<void>(context: context, builder: (dialogContext) => AlertDialog(
      title: const Text('Pair this Android device'),
      content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: gateway, decoration: const InputDecoration(labelText: 'WebSocket gateway')),
        TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Account email')),
        TextField(controller: token, obscureText: true, decoration: const InputDecoration(labelText: 'Pairing token')),
      ])),
      actions: [TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')), FilledButton(onPressed: () async {
        try {
          await _remoteAgent.connect(websocketUrl: gateway.text.trim(), email: email.text.trim(), pairingToken: token.text.trim(), deviceId: 'android_${DateTime.now().millisecondsSinceEpoch}');
          if (dialogContext.mounted) Navigator.pop(dialogContext);
        } catch (error) { if (mounted) _showNotice('$error'); }
      }, child: const Text('Pair'))],
    ));
    gateway.dispose(); email.dispose(); token.dispose();
  }

  Future<void> _settings() async {
    final api = TextEditingController(text: _apiUrl);
    await showDialog<void>(context: context, builder: (dialogContext) => AlertDialog(
      title: const Text('Asuna-AI settings'),
      content: TextField(controller: api, keyboardType: TextInputType.url, decoration: const InputDecoration(labelText: 'Backend API URL')),
      actions: [TextButton(onPressed: _permissions.openSettings, child: const Text('App permissions')), FilledButton(onPressed: () { setState(() => _apiUrl = api.text.trim()); Navigator.pop(dialogContext); }, child: const Text('Save'))],
    ));
    api.dispose();
  }

  @override
  void dispose() { _composer.dispose(); _voice.dispose(); _remoteAgent.disconnect(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Row(children: [Icon(Icons.diamond_outlined), SizedBox(width: 8), Text('Asuna-AI')]), actions: [
      IconButton(onPressed: _pairDevice, icon: Icon(_remoteAgent.status == 'Paired and online' ? Icons.link : Icons.link_off), tooltip: 'Pair Android control'),
      IconButton(onPressed: _settings, icon: const Icon(Icons.settings), tooltip: 'Settings'),
    ]),
    body: SafeArea(child: Column(children: [
      const SizedBox(height: 8),
      Text('$_state${_permissionsRequested ? '' : ' · requesting permissions'}', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
      GestureDetector(onTap: _toggleVoice, child: AsunaCoreWidget(currentState: _state)),
      if (_voiceText.isNotEmpty) Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Text(_voiceText, maxLines: 2, textAlign: TextAlign.center)),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        TextButton.icon(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => HandControlPanel(onGesture: (gesture) { if (gesture == 'PINCH') _send(_composer.text); else _showNotice('Two-finger gesture detected.'); }, onClose: () => Navigator.pop(context)))), icon: const Icon(Icons.pan_tool_outlined), label: const Text('Hand controls')),
        TextButton.icon(onPressed: _toggleVoice, icon: Icon(_listening ? Icons.stop_circle_outlined : Icons.mic_none), label: Text(_listening ? 'Stop voice' : 'Voice chat')),
      ]),
      Expanded(child: ListView.builder(reverse: true, padding: const EdgeInsets.symmetric(horizontal: 16), itemCount: _messages.length, itemBuilder: (_, index) { final message = _messages[_messages.length - 1 - index]; return Align(alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft, child: Container(margin: const EdgeInsets.symmetric(vertical: 5), padding: const EdgeInsets.all(12), constraints: const BoxConstraints(maxWidth: 330), decoration: BoxDecoration(color: message.isUser ? const Color(0xFF6430C7) : const Color(0xFF24213B), borderRadius: BorderRadius.circular(16)), child: Text(message.text))); })),
      Padding(padding: const EdgeInsets.fromLTRB(16, 8, 16, 16), child: Row(children: [Expanded(child: TextField(controller: _composer, onSubmitted: _send, textInputAction: TextInputAction.send, decoration: const InputDecoration(hintText: 'Ask Asuna-AI anything…', border: OutlineInputBorder()))), const SizedBox(width: 8), IconButton.filled(onPressed: _sending ? null : () => _send(_composer.text), icon: _sending ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send))])),
    ])),
  );
}
