import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sensors_plus/sensors_plus.dart';
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
        home: const AsunaHomeScreen(),
      );
}

class AsunaHomeScreen extends StatefulWidget {
  const AsunaHomeScreen({super.key});
  @override
  State<AsunaHomeScreen> createState() => _AsunaHomeScreenState();
}

class _AsunaHomeScreenState extends State<AsunaHomeScreen> {
  bool _loading = true;
  bool _onboarded = false;
  String _email = '';
  String _nickname = '';
  double _speechRate = 0.48;
  bool _voiceOnly = false;
  bool _characterVisible = true;

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
      _speechRate = double.tryParse(prefs.getString('voice_rate') ?? '0.48') ?? 0.48;
      _voiceOnly = prefs.getBool('voice_only') ?? false;
      _characterVisible = prefs.getBool('character_visible') ?? true;
      _loading = false;
    });
  }

  Future<void> _savePrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('character_visible', _characterVisible);
    await prefs.setString('voice_rate', _speechRate.toString());
    await prefs.setBool('voice_only', _voiceOnly);
  }

  void _toggleCharacterVisibility() {
    setState(() => _characterVisible = !_characterVisible);
    _savePrefs();
  }

  void _openSettings() async {
    double tempRate = _speechRate;
    bool tempVoiceOnly = _voiceOnly;
    final result = await showDialog<_SettingsResult>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Settings'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Text('Speech Rate'),
                Expanded(
                  child: Slider(
                    min: 0.1,
                    max: 1.0,
                    divisions: 9,
                    value: tempRate,
                    label: tempRate.toStringAsFixed(2),
                    onChanged: (v) => tempRate = v,
                  ),
                ),
              ],
            ),
            SwitchListTile(
              title: const Text('Voice‑Only Mode'),
              value: tempVoiceOnly,
              onChanged: (v) => tempVoiceOnly = v,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, _SettingsResult(rate: tempRate, voiceOnly: tempVoiceOnly)),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (result != null) {
      setState(() {
        _speechRate = result.rate;
        _voiceOnly = result.voiceOnly;
      });
      _savePrefs();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!_onboarded) {
      return Scaffold(
        appBar: AppBar(title: const Text('Onboarding')),
        body: Center(
          child: ElevatedButton(
            onPressed: () async {
              final prefs = await SharedPreferences.getInstance();
              await prefs.setBool('onboarding_complete', true);
              setState(() => _onboarded = true);
            },
            child: const Text('Complete Onboarding'),
          ),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Asuna Home'),
        actions: [
          IconButton(
            icon: Icon(_characterVisible ? Icons.visibility : Icons.visibility_off),
            tooltip: 'Toggle Anime Character',
            onPressed: _toggleCharacterVisibility,
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Settings',
            onPressed: _openSettings,
          ),
        ],
      ),
      body: Stack(
        children: [
          Center(child: Text('Welcome, ${_nickname.isNotEmpty ? _nickname : 'User'}!')),
          if (_characterVisible)
            const Positioned(bottom: 20, right: 20, child: EyeTrackingCharacter()),
        ],
      ),
    );
  }
}

class _SettingsResult {
  final double rate;
  final bool voiceOnly;
  const _SettingsResult({required this.rate, required this.voiceOnly});
}
