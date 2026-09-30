import React, { useState } from 'react';

export const OnboardingGate = ({ isOpen, onUnlock }) => {
  const [activeTab, setActiveTab] = useState('auth'); // 'auth' | 'permissions' | 'customization'
  const [authMethod, setAuthMethod] = useState('google');

  const deviceGoogleAccounts = [
    { email: 'user.personal@gmail.com', name: 'User Personal' },
    { email: 'user.work@asuna.ai', name: 'User Work (Asuna AI)' },
    { email: 'admin.portfolio@gmail.com', name: 'Admin Portfolio' }
  ];

  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const [voiceSlang, setVoiceSlang] = useState('us_slang');
  const [symbolType, setSymbolType] = useState('diamond');

  const [permissions, setPermissions] = useState({
    fullControl: false,
    cameraGestures: false,
    micVoice: false,
    screenGrounding: false,
    tokenQuotaTerms: false
  });

  if (!isOpen) return null;

  const handleCheckboxChange = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const allPermissionsChecked =
    permissions.fullControl &&
    permissions.cameraGestures &&
    permissions.micVoice &&
    permissions.screenGrounding &&
    permissions.tokenQuotaTerms;

  const handleSelectGoogleAccount = (accEmail) => {
    setSelectedGoogleEmail(accEmail);
    setIsOtpSent(true);
    setOtpMessage(`6-Digit OTP sent to ${accEmail}! Enter '123456' to verify.`);
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    const target = authMethod === 'mobile' ? phoneNumber : emailAddress;
    setIsOtpSent(true);
    setOtpMessage(`6-Digit OTP sent to ${target}! Enter '123456' to verify.`);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode !== '123456' && otpCode !== '999999') {
      alert("Invalid OTP code. Please enter '123456' for verification.");
      return;
    }

    const finalUserEmail = authMethod === 'google' ? selectedGoogleEmail : (authMethod === 'mobile' ? phoneNumber : emailAddress);
    setIsAuthenticated(true);
    setVerifiedEmail(finalUserEmail);
    setActiveTab('permissions');
  };

  const handleCompleteOnboarding = () => {
    if (isAuthenticated && allPermissionsChecked) {
      onUnlock({
        email: verifiedEmail,
        permissionsGranted: true,
        voiceSlang,
        symbolType
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(10, 4, 6, 0.96)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '580px',
        width: '100%',
        backgroundColor: '#18070B',
        border: '2px solid #FFFFFF',
        borderRadius: '28px',
        padding: '32px',
        boxShadow: '0 0 60px rgba(255, 30, 66, 0.4)',
        color: '#FFFFFF'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '6px' }}>
            <svg width="36" height="36" viewBox="0 0 512 512">
              <polygon points="256,56 416,256 256,456 96,256" fill="none" stroke="#FF1E42" strokeWidth="18" />
              <polygon points="256,156 326,256 256,356 186,256" fill="#FFFFFF" />
            </svg>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '1px', margin: 0 }}>
              ASUNA AI ONBOARDING GATE
            </h2>
          </div>
          <p style={{ fontSize: '11px', color: '#FF1E42', fontWeight: '600', margin: 0 }}>
            Mandatory Auth, System Permissions & Voice/Symbol Customization Required
          </p>
        </div>

        {/* Step Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', backgroundColor: '#2B0D14', padding: '4px', borderRadius: '14px' }}>
          <button
            onClick={() => setActiveTab('auth')}
            style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'auth' ? '#FFFFFF' : 'transparent', color: activeTab === 'auth' ? '#000' : '#FFF', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
          >
            1. {isAuthenticated ? '✓ Auth' : '🔑 Auth'}
          </button>
          <button
            onClick={() => isAuthenticated && setActiveTab('permissions')}
            disabled={!isAuthenticated}
            style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'permissions' ? '#FFFFFF' : 'transparent', color: activeTab === 'permissions' ? '#000' : '#FFF', fontWeight: 'bold', fontSize: '11px', cursor: isAuthenticated ? 'pointer' : 'not-allowed', opacity: isAuthenticated ? 1 : 0.5 }}
          >
            2. 🛡️ Permissions ({allPermissionsChecked ? '5/5 ✓' : '5/5'})
          </button>
          <button
            onClick={() => isAuthenticated && allPermissionsChecked && setActiveTab('customization')}
            disabled={!isAuthenticated || !allPermissionsChecked}
            style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'customization' ? '#FFFFFF' : 'transparent', color: activeTab === 'customization' ? '#000' : '#FFF', fontWeight: 'bold', fontSize: '11px', cursor: (isAuthenticated && allPermissionsChecked) ? 'pointer' : 'not-allowed', opacity: (isAuthenticated && allPermissionsChecked) ? 1 : 0.5 }}
          >
            3. 🎙️ Voice & Symbol
          </button>
        </div>

        {/* TAB 1: AUTHENTICATION */}
        {activeTab === 'auth' && (
          <div>
            {!isAuthenticated ? (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button onClick={() => { setAuthMethod('google'); setIsOtpSent(false); setSelectedGoogleEmail(''); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #FFFFFF', backgroundColor: authMethod === 'google' ? '#FF1E42' : 'transparent', color: '#FFF', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Google Accounts</button>
                  <button onClick={() => { setAuthMethod('mobile'); setIsOtpSent(false); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #FFFFFF', backgroundColor: authMethod === 'mobile' ? '#FF1E42' : 'transparent', color: '#FFF', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Mobile OTP</button>
                  <button onClick={() => { setAuthMethod('email'); setIsOtpSent(false); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #FFFFFF', backgroundColor: authMethod === 'email' ? '#FF1E42' : 'transparent', color: '#FFF', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Custom Email</button>
                </div>

                {authMethod === 'google' && (
                  <div>
                    {!isOtpSent ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 'bold' }}>Select Device Google Account:</span>
                        {deviceGoogleAccounts.map((acc, idx) => (
                          <button key={idx} onClick={() => handleSelectGoogleAccount(acc.email)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#2B0D14', border: '1px solid rgba(255,255,255,0.4)', color: '#FFF', cursor: 'pointer' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF' }}>🌐 {acc.name}</div>
                              <div style={{ fontSize: '10px', color: '#CBD5E1' }}>{acc.email}</div>
                            </div>
                            <span style={{ fontSize: '11px', color: '#FF1E42', fontWeight: 'bold' }}>Send OTP →</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#4ADE80' }}>{otpMessage}</span>
                        <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" maxLength="6" required style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#2B0D14', border: '1px solid #FFFFFF', color: '#FFF', fontSize: '16px', letterSpacing: '4px', textAlign: 'center', outline: 'none' }} />
                        <button type="submit" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>Verify OTP & Proceed</button>
                      </form>
                    )}
                  </div>
                )}

                {(authMethod === 'mobile' || authMethod === 'email') && (
                  <div>
                    {!isOtpSent ? (
                      <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input type={authMethod === 'mobile' ? 'tel' : 'email'} value={authMethod === 'mobile' ? phoneNumber : emailAddress} onChange={(e) => authMethod === 'mobile' ? setPhoneNumber(e.target.value) : setEmailAddress(e.target.value)} placeholder={authMethod === 'mobile' ? '+91 98765 43210' : 'user@example.com'} required style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#2B0D14', border: '1px solid #FFFFFF', color: '#FFF', fontSize: '14px', outline: 'none' }} />
                        <button type="submit" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>Send 6-Digit OTP</button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#4ADE80' }}>{otpMessage}</span>
                        <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" maxLength="6" required style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#2B0D14', border: '1px solid #FFFFFF', color: '#FFF', fontSize: '16px', letterSpacing: '4px', textAlign: 'center', outline: 'none' }} />
                        <button type="submit" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>Verify OTP & Proceed</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '15px', color: '#4ADE80', fontWeight: 'bold', marginBottom: '6px' }}>✓ Email / Mobile Verified! ({verifiedEmail})</div>
                <button onClick={() => setActiveTab('permissions')} style={{ padding: '10px 22px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>Proceed to System Permissions →</button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#2B0D14', borderRadius: '12px', border: permissions.fullControl ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={permissions.fullControl} onChange={() => handleCheckboxChange('fullControl')} style={{ width: '18px', height: '18px', accentColor: '#FF1E42' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF' }}>1. Full PC & Mobile System Control</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Allows Asuna to open apps, adjust volume, and control settings</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#2B0D14', borderRadius: '12px', border: permissions.cameraGestures ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={permissions.cameraGestures} onChange={() => handleCheckboxChange('cameraGestures')} style={{ width: '18px', height: '18px', accentColor: '#FF1E42' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF' }}>2. Camera & Hand Tracking Reticle</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Enables real-time MediaPipe air-mouse gesture navigation</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#2B0D14', borderRadius: '12px', border: permissions.micVoice ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={permissions.micVoice} onChange={() => handleCheckboxChange('micVoice')} style={{ width: '18px', height: '18px', accentColor: '#FF1E42' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF' }}>3. Microphone & Background Voice Engine</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Enables trilingual voice recognition & closed-app execution</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#2B0D14', borderRadius: '12px', border: permissions.screenGrounding ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={permissions.screenGrounding} onChange={() => handleCheckboxChange('screenGrounding')} style={{ width: '18px', height: '18px', accentColor: '#FF1E42' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF' }}>4. Screen Understanding & Telemetry Grounding</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Allows Asuna to analyze screen context and visual elements</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#2B0D14', borderRadius: '12px', border: permissions.tokenQuotaTerms ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={permissions.tokenQuotaTerms} onChange={() => handleCheckboxChange('tokenQuotaTerms')} style={{ width: '18px', height: '18px', accentColor: '#FF1E42' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF' }}>5. 4-Hour Token Quota & Terms Agreement</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Agrees to 4-hour continuous usage quota with 2-hour auto-renewal</div>
                </div>
              </label>
            </div>

            <button onClick={() => setActiveTab('customization')} disabled={!allPermissionsChecked} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: allPermissionsChecked ? '#FFFFFF' : '#475569', color: '#000', fontWeight: 'bold', cursor: allPermissionsChecked ? 'pointer' : 'not-allowed' }}>
              {allPermissionsChecked ? 'Proceed to Voice & Symbol Customization →' : 'Check All 5 Permissions to Continue'}
            </button>
          </div>
        )}

        {/* TAB 3: VOICE SLANG & 3D CORE SYMBOL CUSTOMIZATION */}
        {activeTab === 'customization' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>
                🎙️ Select Preferred Voice Slang Accent:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#2B0D14', borderRadius: '10px', border: voiceSlang === 'us_slang' ? '1px solid #FFFFFF' : '1px solid transparent', cursor: 'pointer' }}>
                  <input type="radio" name="voiceSlang" checked={voiceSlang === 'us_slang'} onChange={() => setVoiceSlang('us_slang')} />
                  <div>
                    <span style={{ fontSize: '12px', color: '#FFF', fontWeight: 'bold' }}>🇺🇸 US English Slang</span>
                    <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block' }}>"Hey buddy! What's popping? System volume boosted!"</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#2B0D14', borderRadius: '10px', border: voiceSlang === 'indian_english' ? '1px solid #FFFFFF' : '1px solid transparent', cursor: 'pointer' }}>
                  <input type="radio" name="voiceSlang" checked={voiceSlang === 'indian_english'} onChange={() => setVoiceSlang('indian_english')} />
                  <div>
                    <span style={{ fontSize: '12px', color: '#FFF', fontWeight: 'bold' }}>🇮🇳 Indian English Slang</span>
                    <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block' }}>"Arey yaaro! System volume full 100% load kar diya!"</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#2B0D14', borderRadius: '10px', border: voiceSlang === 'teluglish' ? '1px solid #FFFFFF' : '1px solid transparent', cursor: 'pointer' }}>
                  <input type="radio" name="voiceSlang" checked={voiceSlang === 'teluglish'} onChange={() => setVoiceSlang('teluglish')} />
                  <div>
                    <span style={{ fontSize: '12px', color: '#FFF', fontWeight: 'bold' }}>🏛️ Teluglish Vernacular Slang</span>
                    <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block' }}>"Macha! Volume full 100% ki set chesa!"</span>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>
                💎 Select 3D AI Core Symbol Style:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={() => setSymbolType('diamond')} style={{ padding: '10px', borderRadius: '10px', border: symbolType === 'diamond' ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.3)', backgroundColor: '#2B0D14', color: '#FFF', fontSize: '11px', cursor: 'pointer' }}>
                  💎 Diamond Octahedron
                </button>
                <button onClick={() => setSymbolType('icosahedron')} style={{ padding: '10px', borderRadius: '10px', border: symbolType === 'icosahedron' ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.3)', backgroundColor: '#2B0D14', color: '#FFF', fontSize: '11px', cursor: 'pointer' }}>
                  💠 Quantum Crystal
                </button>
                <button onClick={() => setSymbolType('sphere')} style={{ padding: '10px', borderRadius: '10px', border: symbolType === 'sphere' ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.3)', backgroundColor: '#2B0D14', color: '#FFF', fontSize: '11px', cursor: 'pointer' }}>
                  🌌 Plasma Energy Sphere
                </button>
                <button onClick={() => setSymbolType('pyramid')} style={{ padding: '10px', borderRadius: '10px', border: symbolType === 'pyramid' ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.3)', backgroundColor: '#2B0D14', color: '#FFF', fontSize: '11px', cursor: 'pointer' }}>
                  👑 Imperial Gold Prism
                </button>
              </div>
            </div>

            <button onClick={handleCompleteOnboarding} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', backgroundColor: '#FF1E42', color: '#FFFFFF', fontWeight: '800', fontSize: '15px', letterSpacing: '1px', cursor: 'pointer', boxShadow: '0 0 30px rgba(255, 30, 66, 0.5)' }}>
              🚀 UNLOCK & CONTINUE TO ASUNA AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
