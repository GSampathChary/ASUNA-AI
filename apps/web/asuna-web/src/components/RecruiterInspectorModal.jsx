import React from 'react';

export const RecruiterInspectorModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(13, 4, 6, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '680px',
        width: '100%',
        backgroundColor: '#1A080C',
        border: '2px solid #FFD700',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)',
        color: '#F1F5F9',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#FFD700', letterSpacing: '1px', margin: 0 }}>
              📊 RECRUITER TECHNICAL INSPECTOR
            </h2>
            <span style={{ fontSize: '11px', color: '#FF1E42' }}>Asuna AI Architecture Metrics & Engineering Specifications</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFD700', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Technical Key Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '12px', backgroundColor: '#290C13', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ADE80' }}>60 FPS</div>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>Three.js WebGL Engine</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#290C13', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFD700' }}>12 ms</div>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>WebSocket Telemetry</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#290C13', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF1E42' }}>3-Tier</div>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>Security Policy Engine</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#290C13', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38BDF8' }}>Trilingual</div>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>Eng / Tel / Hin AI Brain</div>
          </div>
        </div>

        {/* System Architecture Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', lineHeight: '1.5' }}>
          <div style={{ padding: '14px', backgroundColor: '#290C13', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.2)' }}>
            <div style={{ color: '#FFD700', fontWeight: '600', marginBottom: '4px' }}>⚡ Performance & Zero-Lag Engineering</div>
            <div>- Web Worker thread offloading for MediaPipe landmark tracking.<br />- RequestAnimationFrame batching for smooth 60 FPS Three.js diamond rendering.<br />- Zero-allocation memory pooling in gesture smoothing pipeline.</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: '#290C13', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.2)' }}>
            <div style={{ color: '#FFD700', fontWeight: '600', marginBottom: '4px' }}>🛡️ Security-First Monorepo Architecture</div>
            <div>- Decoupled FastAPI backend + PostgreSQL pgvector vector database.<br />- Windows Native Ctypes Agent + Android Accessibility Service integration.<br />- Strict ActionValidator gate intercepting sensitive and high-risk actions.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
