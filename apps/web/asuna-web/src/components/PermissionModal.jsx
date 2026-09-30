import React, { useState } from 'react';

export const PermissionModal = ({ isOpen, onGrantPermissions }) => {
  const [permissions, setPermissions] = useState({
    osControl: false,
    cameraGestures: false,
    voiceMic: false,
    screenGrounding: false
  });

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allGranted = permissions.osControl && permissions.cameraGestures && permissions.voiceMic && permissions.screenGrounding;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(10, 4, 6, 0.94)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#18070B',
        border: '2px solid #FFFFFF',
        borderRadius: '24px',
        padding: '30px',
        boxShadow: '0 0 50px rgba(255, 30, 66, 0.4)',
        color: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '28px' }}>🛡️</span>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>SYSTEM AUTHORIZATION REQUIRED</h2>
            <span style={{ fontSize: '11px', color: '#FF1E42', fontWeight: '600' }}>3-Tier Security Policy Authorization</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5', marginBottom: '20px' }}>
          Asuna AI requires explicit permission check-in to enable real-time OS device automation, air-mouse hand gestures, and background voice control.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#2B0D14', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF' }}>💻 Native OS Device Control</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Control apps, volume, browser, and system settings</div>
            </div>
            <input type="checkbox" checked={permissions.osControl} onChange={() => handleToggle('osControl')} style={{ width: '18px', height: '18px', accentColor: '#FF1E42' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#2B0D14', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF' }}>📷 Camera & Air-Mouse Gestures</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Real-time hand tracking reticle & target magnetic snap</div>
            </div>
            <input type="checkbox" checked={permissions.cameraGestures} onChange={() => handleToggle('cameraGestures')} style={{ width: '18px', height: '18px', accentColor: '#FF1E42' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#2B0D14', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF' }}>🎤 Microphone & Background Voice</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Trilingual voice recognition & closed-app execution</div>
            </div>
            <input type="checkbox" checked={permissions.voiceMic} onChange={() => handleToggle('voiceMic')} style={{ width: '18px', height: '18px', accentColor: '#FF1E42' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#2B0D14', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF' }}>👁️ Screen Grounding Telemetry</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Analyze visual elements and screen context</div>
            </div>
            <input type="checkbox" checked={permissions.screenGrounding} onChange={() => handleToggle('screenGrounding')} style={{ width: '18px', height: '18px', accentColor: '#FF1E42' }} />
          </label>
        </div>

        <button
          onClick={onGrantPermissions}
          disabled={!allGranted}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '16px',
            border: 'none',
            backgroundColor: allGranted ? '#FF1E42' : '#475569',
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: '15px',
            letterSpacing: '1px',
            cursor: allGranted ? 'pointer' : 'not-allowed',
            boxShadow: allGranted ? '0 0 30px rgba(255, 30, 66, 0.5)' : 'none'
          }}
        >
          {allGranted ? 'AUTHORIZE FULL CONTROL & START' : 'GRANT ALL PERMISSIONS TO CONTINUE'}
        </button>
      </div>
    </div>
  );
};
