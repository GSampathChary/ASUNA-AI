import React, { useState } from 'react';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState('google');

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

  if (!isOpen) return null;

  const handleSelectGoogleAccount = (accEmail) => {
    setSelectedGoogleEmail(accEmail);
    setIsOtpSent(true);
    setOtpMessage(`6-Digit OTP sent to ${accEmail}! Enter '123456' to verify.`);
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    const target = activeTab === 'mobile' ? phoneNumber : emailAddress;
    setIsOtpSent(true);
    setOtpMessage(`6-Digit OTP sent to ${target}! Enter '123456' to verify.`);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode !== '123456' && otpCode !== '999999') {
      alert("Invalid OTP code. Please enter '123456' for verification.");
      return;
    }

    const finalEmail = activeTab === 'google' ? selectedGoogleEmail : (activeTab === 'mobile' ? phoneNumber : emailAddress);
    onAuthSuccess({
      user_id: 'usr_99812',
      email: finalEmail,
      phone: activeTab === 'mobile' ? phoneNumber : '+919876543210',
      auth_type: activeTab
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(10, 4, 6, 0.92)',
      backdropFilter: 'blur(14px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#18070B',
        border: '2px solid #FFFFFF',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 0 50px rgba(255, 30, 66, 0.35)',
        color: '#FFFFFF'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
              🔑 ASUNA AI AUTHENTICATION
            </h2>
            <span style={{ fontSize: '11px', color: '#FF1E42', fontWeight: '600' }}>Google Account Selector & OTP Verification</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Tab Selector Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#2B0D14', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => { setActiveTab('google'); setIsOtpSent(false); setSelectedGoogleEmail(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'google' ? '#FFFFFF' : 'transparent', color: activeTab === 'google' ? '#000' : '#FFF', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
          >
            🌐 Google Accounts
          </button>
          <button
            onClick={() => { setActiveTab('mobile'); setIsOtpSent(false); }}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'mobile' ? '#FFFFFF' : 'transparent', color: activeTab === 'mobile' ? '#000' : '#FFF', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
          >
            📱 Mobile OTP
          </button>
          <button
            onClick={() => { setActiveTab('email'); setIsOtpSent(false); }}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'email' ? '#FFFFFF' : 'transparent', color: activeTab === 'email' ? '#000' : '#FFF', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
          >
            ✉️ Custom Email
          </button>
        </div>

        {/* GOOGLE DEVICE ACCOUNT PICKER */}
        {activeTab === 'google' && (
          <div>
            {!isOtpSent ? (
              <div>
                <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Select Device Google Account to Send OTP:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {deviceGoogleAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectGoogleAccount(acc.email)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#2B0D14',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#FFF',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF' }}>🌐 {acc.name}</div>
                        <div style={{ fontSize: '11px', color: '#CBD5E1' }}>{acc.email}</div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#FF1E42', fontWeight: 'bold' }}>Send OTP →</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: '#4ADE80' }}>{otpMessage}</span>
                <label style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 'bold' }}>Enter 6-Digit OTP Code Sent to {selectedGoogleEmail}:</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  required
                  style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#2B0D14', border: '1px solid #FFFFFF', color: '#FFF', fontSize: '16px', letterSpacing: '4px', textAlign: 'center', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                  Verify OTP & Sign In
                </button>
              </form>
            )}
          </div>
        )}

        {/* MOBILE / CUSTOM EMAIL OTP */}
        {(activeTab === 'mobile' || activeTab === 'email') && (
          <div>
            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 'bold' }}>Enter {activeTab === 'mobile' ? 'Mobile Number' : 'Email Address'}:</label>
                <input
                  type={activeTab === 'mobile' ? 'tel' : 'email'}
                  value={activeTab === 'mobile' ? phoneNumber : emailAddress}
                  onChange={(e) => activeTab === 'mobile' ? setPhoneNumber(e.target.value) : setEmailAddress(e.target.value)}
                  placeholder={activeTab === 'mobile' ? '+91 98765 43210' : 'user@example.com'}
                  required
                  style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#2B0D14', border: '1px solid #FFFFFF', color: '#FFF', fontSize: '14px', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                  Send 6-Digit OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: '#4ADE80' }}>{otpMessage}</span>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  required
                  style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#2B0D14', border: '1px solid #FFFFFF', color: '#FFF', fontSize: '16px', letterSpacing: '4px', textAlign: 'center', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                  Verify OTP & Sign In
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
