import React from 'react';

export const MindMapGraph = ({ isVisible, currentQuery }) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '620px',
      backgroundColor: 'rgba(26, 8, 12, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 215, 0, 0.4)',
      borderRadius: '20px',
      padding: '16px 20px',
      zIndex: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      color: '#F1F5F9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#FFD700' }}>🧠</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFD700', letterSpacing: '0.8px' }}>ASUNA MINDMAP — LIVE TASK EXECUTION FLOWCHART</span>
        </div>
        <span style={{ fontSize: '10px', color: '#4ADE80', fontWeight: '600' }}>ACTIVE REAL-TIME PLAN</span>
      </div>

      {/* SVG Node Graph */}
      <svg width="100%" height="85" viewBox="0 0 560 85">
        <defs>
          <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF1E42" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>

        {/* Connecting Animated Lines */}
        <line x1="90" y1="42" x2="220" y2="42" stroke="url(#goldLine)" strokeWidth="2.5" strokeDasharray="6 4" />
        <line x1="310" y1="42" x2="440" y2="42" stroke="url(#goldLine)" strokeWidth="2.5" strokeDasharray="6 4" />

        {/* Node 1: Input Query */}
        <g transform="translate(45, 42)">
          <rect x="-40" y="-22" width="80" height="44" rx="10" fill="#290C13" stroke="#FF1E42" strokeWidth="1.5" />
          <text textAnchor="middle" y="-4" fill="#FFD700" fontSize="10" fontWeight="bold">USER INPUT</text>
          <text textAnchor="middle" y="10" fill="#CBD5E1" fontSize="8">{currentQuery ? 'Parsed' : 'Listening...'}</text>
        </g>

        {/* Node 2: Intent & Security Policy */}
        <g transform="translate(265, 42)">
          <rect x="-45" y="-22" width="90" height="44" rx="10" fill="#290C13" stroke="#FFD700" strokeWidth="1.5" />
          <text textAnchor="middle" y="-4" fill="#FFD700" fontSize="10" fontWeight="bold">SECURITY GATE</text>
          <text textAnchor="middle" y="10" fill="#4ADE80" fontSize="8">LEVEL_1_SAFE</text>
        </g>

        {/* Node 3: Device Tool Action */}
        <g transform="translate(485, 42)">
          <rect x="-40" y="-22" width="80" height="44" rx="10" fill="#290C13" stroke="#4ADE80" strokeWidth="1.5" />
          <text textAnchor="middle" y="-4" fill="#4ADE80" fontSize="10" fontWeight="bold">TOOL EXEC</text>
          <text textAnchor="middle" y="10" fill="#FFF" fontSize="8">Dispatched</text>
        </g>
      </svg>
    </div>
  );
};
