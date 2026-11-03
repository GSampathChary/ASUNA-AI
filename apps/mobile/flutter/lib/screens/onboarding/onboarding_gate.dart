import 'package:flutter/material.dart';

/// 3-step onboarding: Auth → Permissions → Customization
/// Mirrors the web OnboardingGate.jsx experience.
class OnboardingGate extends StatefulWidget {
  const OnboardingGate({super.key, required this.onUnlock});
  final void Function({
    required String email,
    required String nickname,
    required String voiceSlang,
    required String symbolType,
  }) onUnlock;

  @override
  State<OnboardingGate> createState() => _OnboardingGateState();
}

class _OnboardingGateState extends State<OnboardingGate> {
  int _tab = 0; // 0=auth 1=permissions 2=customization

  // Auth state
  String _authMethod = 'google'; // google | mobile | email
  bool _otpSent = false;
  bool _authenticated = false;
  String _verifiedEmail = '';
  String _otpMessage = '';
  String _otpInput = '';
  String _phoneInput = '';
  String _emailInput = '';

  // Permissions state
  final Map<String, bool> _perms = {
    'fullControl': false,
    'camera': false,
    'mic': false,
    'screen': false,
    'quota': false,
  };

  bool get _allPerms => _perms.values.every((v) => v);

  // Customization
  String _voiceSlang = 'us_slang';
  String _symbolType = 'diamond';

  final _nicknameController = TextEditingController();

  static const _mockGoogleAccounts = [
    {'email': 'user.personal@gmail.com', 'name': 'User Personal'},
    {'email': 'user.work@asuna.ai', 'name': 'User Work (Asuna AI)'},
    {'email': 'admin.portfolio@gmail.com', 'name': 'Admin Portfolio'},
  ];

  static const _crimson = Color(0xFFFF1E42);
  static const _darkBg = Color(0xFF18070B);
  static const _cardBg = Color(0xFF2B0D14);

  // ---------- Helpers ----------

  void _selectGoogle(String email) {
    setState(() {
      _verifiedEmail = email;
      _otpSent = true;
      _otpMessage = "6-Digit OTP sent to $email! Enter '123456' to verify.";
    });
  }

  void _sendOtp() {
    final target = _authMethod == 'mobile' ? _phoneInput : _emailInput;
    setState(() {
      _otpSent = true;
      _otpMessage = "6-Digit OTP sent to $target! Enter '123456' to verify.";
    });
  }

  void _verifyOtp() {
    if (_otpInput != '123456' && _otpInput != '999999') {
      _showSnack("Invalid OTP. Enter '123456' to verify.");
      return;
    }
    final email = _authMethod == 'google'
        ? _verifiedEmail
        : (_authMethod == 'mobile' ? _phoneInput : _emailInput);
    setState(() {
      _authenticated = true;
      _verifiedEmail = email;
      _tab = 1;
    });
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg), duration: const Duration(seconds: 3)));
  }

  void _complete() {
    if (!_authenticated || !_allPerms) return;
    final nickname = _nicknameController.text.trim().isNotEmpty
        ? _nicknameController.text.trim()
        : _verifiedEmail.split('@').first;
    widget.onUnlock(
      email: _verifiedEmail,
      nickname: nickname,
      voiceSlang: _voiceSlang,
      symbolType: _symbolType,
    );
  }

  // ---------- Build ----------

  @override
  void dispose() {
    _nicknameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black.withOpacity(0.97),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 520),
              decoration: BoxDecoration(
                color: _darkBg,
                border: Border.all(color: Colors.white, width: 2),
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [BoxShadow(color: Color(0x66FF1E42), blurRadius: 60)],
              ),
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildHeader(),
                  const SizedBox(height: 16),
                  _buildTabBar(),
                  const SizedBox(height: 20),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: _tab == 0
                        ? _buildAuthTab()
                        : _tab == 1
                            ? _buildPermissionsTab()
                            : _buildCustomizationTab(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() => Column(children: [
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          CustomPaint(size: const Size(32, 32), painter: _DiamondIconPainter()),
          const SizedBox(width: 10),
          const Text('ASUNA AI ONBOARDING GATE',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
        ]),
        const SizedBox(height: 4),
        const Text('Mandatory Auth, System Permissions & Voice/Symbol Customization',
            style: TextStyle(fontSize: 10, color: _crimson, fontWeight: FontWeight.w600)),
      ]);

  Widget _buildTabBar() {
    final labels = [
      _authenticated ? '✓ Auth' : '🔑 Auth',
      '🛡️ Permissions (${_perms.values.where((v) => v).length}/5${_allPerms ? " ✓" : ""})',
      '🎙️ Voice & Symbol',
    ];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: _cardBg, borderRadius: BorderRadius.circular(14)),
      child: Row(children: List.generate(3, (i) {
        final enabled = i == 0 || (i == 1 && _authenticated) || (i == 2 && _authenticated && _allPerms);
        return Expanded(
          child: GestureDetector(
            onTap: enabled ? () => setState(() => _tab = i) : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: _tab == i ? Colors.white : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(labels[i],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: _tab == i ? Colors.black : (enabled ? Colors.white : Colors.white38))),
            ),
          ),
        );
      })),
    );
  }

  // ---- Auth Tab ----
  Widget _buildAuthTab() {
    if (_authenticated) {
      return Column(key: const ValueKey('auth-done'), mainAxisSize: MainAxisSize.min, children: [
        Text('✓ Verified! ($_verifiedEmail)',
            style: const TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        _actionButton('Proceed to System Permissions →', () => setState(() => _tab = 1)),
      ]);
    }

    return Column(key: const ValueKey('auth-form'), mainAxisSize: MainAxisSize.min, children: [
      // Method selector
      Row(children: ['google', 'mobile', 'email'].map((m) {
        final labels = {'google': 'Google Accounts', 'mobile': 'Mobile OTP', 'email': 'Custom Email'};
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() { _authMethod = m; _otpSent = false; }),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: _authMethod == m ? _crimson : Colors.transparent,
                border: Border.all(color: Colors.white60),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(labels[m]!, textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
        );
      }).toList()),
      const SizedBox(height: 16),

      if (_authMethod == 'google') _buildGoogleAuth(),
      if (_authMethod == 'mobile' || _authMethod == 'email') _buildOtpAuth(),
    ]);
  }

  Widget _buildGoogleAuth() {
    if (!_otpSent) {
      return Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Select Device Google Account:', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        ..._mockGoogleAccounts.map((acc) => GestureDetector(
          onTap: () => _selectGoogle(acc['email']!),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(color: _cardBg, border: Border.all(color: Colors.white38), borderRadius: BorderRadius.circular(12)),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('🌐 ${acc["name"]}', style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                Text(acc['email']!, style: const TextStyle(fontSize: 10, color: Color(0xFFCBD5E1))),
              ]),
              const Text('Send OTP →', style: TextStyle(fontSize: 11, color: _crimson, fontWeight: FontWeight.bold)),
            ]),
          ),
        )),
      ]);
    }
    return _buildOtpInput();
  }

  Widget _buildOtpAuth() {
    if (!_otpSent) {
      return Column(mainAxisSize: MainAxisSize.min, children: [
        _styledField(
          hint: _authMethod == 'mobile' ? '+91 98765 43210' : 'user@example.com',
          keyboard: _authMethod == 'mobile' ? TextInputType.phone : TextInputType.emailAddress,
          onChanged: (v) => setState(() { if (_authMethod == 'mobile') _phoneInput = v; else _emailInput = v; }),
        ),
        const SizedBox(height: 12),
        _actionButton('Send 6-Digit OTP', _sendOtp),
      ]);
    }
    return _buildOtpInput();
  }

  Widget _buildOtpInput() => Column(mainAxisSize: MainAxisSize.min, children: [
    Text(_otpMessage, style: const TextStyle(fontSize: 11, color: Color(0xFF4ADE80))),
    const SizedBox(height: 12),
    TextField(
      keyboardType: TextInputType.number,
      maxLength: 6,
      textAlign: TextAlign.center,
      style: const TextStyle(fontSize: 20, color: Colors.white, letterSpacing: 8),
      decoration: const InputDecoration(
        hintText: '123456', hintStyle: TextStyle(color: Colors.white38),
        counterText: '',
        enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white)),
        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: _crimson, width: 2)),
        filled: true, fillColor: Color(0xFF2B0D14),
      ),
      onChanged: (v) => setState(() => _otpInput = v),
    ),
    const SizedBox(height: 12),
    _actionButton('Verify OTP & Proceed', _verifyOtp),
  ]);

  // ---- Permissions Tab ----
  Widget _buildPermissionsTab() {
    final items = [
      ('fullControl', '1. Full PC & Mobile System Control', 'Allows Asuna to open apps, adjust volume, and control settings'),
      ('camera', '2. Camera & Hand Tracking Reticle', 'Enables real-time MediaPipe air-mouse gesture navigation'),
      ('mic', '3. Microphone & Background Voice Engine', 'Enables trilingual voice recognition & closed-app execution'),
      ('screen', '4. Screen Understanding & Telemetry Grounding', 'Allows Asuna to analyze screen context and visual elements'),
      ('quota', '5. 4-Hour Token Quota & Terms Agreement', 'Agrees to 4-hour continuous usage quota with 2-hour auto-renewal'),
    ];

    return Column(key: const ValueKey('perms'), mainAxisSize: MainAxisSize.min, children: [
      ...items.map((item) {
        final (key, title, sub) = item;
        return GestureDetector(
          onTap: () => setState(() => _perms[key] = !_perms[key]!),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: _cardBg,
              border: Border.all(color: _perms[key]! ? Colors.white : Colors.white24),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(children: [
              Icon(_perms[key]! ? Icons.check_box : Icons.check_box_outline_blank,
                  color: _perms[key]! ? _crimson : Colors.white38, size: 20),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                Text(sub, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
              ])),
            ]),
          ),
        );
      }),
      const SizedBox(height: 12),
      _actionButton(
        _allPerms ? 'Proceed to Voice & Symbol Customization →' : 'Check All 5 Permissions to Continue',
        _allPerms ? () => setState(() => _tab = 2) : null,
      ),
    ]);
  }

  // ---- Customization Tab ----
  Widget _buildCustomizationTab() {
    final slangs = [
      ('us_slang', '🇺🇸 US English Slang', '"Hey buddy! What\'s popping? System volume boosted!"'),
      ('indian_english', '🇮🇳 Indian English Slang', '"Arey yaaro! System volume full 100% load kar diya!"'),
      ('teluglish', '🏛️ Teluglish Vernacular Slang', '"Macha! Volume full 100% ki set chesa!"'),
    ];
    final symbols = [
      ('diamond', '💎 Diamond Octahedron'),
      ('icosahedron', '💠 Quantum Crystal'),
      ('sphere', '🌌 Plasma Energy Sphere'),
      ('pyramid', '👑 Imperial Gold Prism'),
    ];

    return Column(key: const ValueKey('custom'), mainAxisSize: MainAxisSize.min, children: [
      const Align(alignment: Alignment.centerLeft,
          child: Text('🎙️ Select Preferred Voice Slang Accent:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white))),
      const SizedBox(height: 8),
      ...slangs.map((s) {
        final (val, label, example) = s;
        return GestureDetector(
          onTap: () => setState(() => _voiceSlang = val),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: _cardBg,
              border: Border.all(color: _voiceSlang == val ? Colors.white : Colors.transparent),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(children: [
              Icon(_voiceSlang == val ? Icons.radio_button_checked : Icons.radio_button_off,
                  color: _voiceSlang == val ? Colors.white : Colors.white38, size: 18),
              const SizedBox(width: 10),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(label, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                Text(example, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
              ]),
            ]),
          ),
        );
      }),
      const SizedBox(height: 16),
      const Align(alignment: Alignment.centerLeft,
          child: Text('💎 Select 3D AI Core Symbol Style:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white))),
      const SizedBox(height: 8),
      GridView.count(
        crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 8, mainAxisSpacing: 8, childAspectRatio: 3,
        children: symbols.map((s) {
          final (val, label) = s;
          return GestureDetector(
            onTap: () => setState(() => _symbolType = val),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              decoration: BoxDecoration(
                color: _cardBg,
                border: Border.all(color: _symbolType == val ? Colors.white : Colors.white30,
                    width: _symbolType == val ? 2 : 1),
                borderRadius: BorderRadius.circular(10),
              ),
              alignment: Alignment.center,
              child: Text(label, style: const TextStyle(fontSize: 11, color: Colors.white), textAlign: TextAlign.center),
            ),
          );
        }).toList(),
      ),
      const SizedBox(height: 16),
      const Align(alignment: Alignment.centerLeft,
          child: Text('👤 Your Nickname:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white))),
      const SizedBox(height: 6),
      _styledField(hint: 'e.g. Sampath', controller: _nicknameController),
      const SizedBox(height: 20),
      GestureDetector(
        onTap: _complete,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: _crimson,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [BoxShadow(color: Color(0x80FF1E42), blurRadius: 30)],
          ),
          alignment: Alignment.center,
          child: const Text('🚀 UNLOCK & CONTINUE TO ASUNA AI',
              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1)),
        ),
      ),
    ]);
  }

  // ---- Shared Helpers ----
  Widget _styledField({
    String? hint,
    TextInputType? keyboard,
    void Function(String)? onChanged,
    TextEditingController? controller,
  }) =>
      TextField(
        controller: controller,
        keyboardType: keyboard,
        style: const TextStyle(color: Colors.white),
        onChanged: onChanged,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.white38),
          enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.white60)),
          focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: _crimson, width: 2)),
          filled: true,
          fillColor: _cardBg,
        ),
      );

  Widget _actionButton(String label, VoidCallback? onTap) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: onTap != null ? Colors.white : const Color(0xFF475569),
        borderRadius: BorderRadius.circular(12),
      ),
      alignment: Alignment.center,
      child: Text(label,
          style: TextStyle(
              color: onTap != null ? Colors.black : Colors.white54,
              fontWeight: FontWeight.bold,
              fontSize: 13)),
    ),
  );
}

// Small diamond icon for the header
class _DiamondIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final path = Path()
      ..moveTo(cx, 4)
      ..lineTo(size.width - 4, cy)
      ..lineTo(cx, size.height - 4)
      ..lineTo(4, cy)
      ..close();
    canvas.drawPath(path, Paint()..color = const Color(0xFFFF1E42)..style = PaintingStyle.stroke..strokeWidth = 2.5);
    final inner = Path()
      ..moveTo(cx, cy - 6)
      ..lineTo(cx + 8, cy)
      ..lineTo(cx, cy + 6)
      ..lineTo(cx - 8, cy)
      ..close();
    canvas.drawPath(inner, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
