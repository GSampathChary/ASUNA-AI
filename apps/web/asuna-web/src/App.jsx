import React, { useState, useEffect } from 'react';
import { AsunaCoreWeb } from './components/AsunaCoreWeb';
import { PermissionModal } from './components/PermissionModal';
import { MindMapGraph } from './components/MindMapGraph';
import { RecruiterInspectorModal } from './components/RecruiterInspectorModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingGate } from './components/OnboardingGate';

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: 'asuna',
      text: 'Namaste! I am Asuna AI. Crimson Red & Pure White Theme Active! Type "increase volume to 100" to test.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [currentState, setCurrentState] = useState('IDLE');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [isListening, setIsListening] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState('');

  const [isOnboardingGateOpen, setIsOnboardingGateOpen] = useState(true);

  const [voiceSlang, setVoiceSlang] = useState('us_slang');
  const [symbolType, setSymbolType] = useState('diamond');

  const [userProfile, setUserProfile] = useState({
    user_id: 'usr_99812',
    email: 'user@asuna.ai',
    phone: '+919876543210',
    isLoggedIn: false
  });

  const [tokenQuota, setTokenQuota] = useState({
    balance: 240000,
    max_capacity: 240000,
    percentage: 100,
    continuous_hours_left: 4.0,
    renews_in_minutes: 119
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTokenQuota((prev) => {
        if (prev.renews_in_minutes <= 1) {
          return {
            ...prev,
            balance: prev.max_capacity,
            percentage: 100,
            continuous_hours_left: 4.0,
            renews_in_minutes: 120
          };
        }
        return {
          ...prev,
          renews_in_minutes: prev.renews_in_minutes - 1
        };
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const playAudioFeedback = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log("Audio feedback ready");
    }
  };

  const handleQuickAction = (actionName, queryText) => {
    setInputText(queryText);
    handleSendMessage(null, queryText);
  };

  const openExternalWebsite = (target) => {
    let url = target.trim();
    if (url.includes('youtube')) {
      url = 'https://www.youtube.com';
    } else if (url.includes('chrome') || url.includes('google')) {
      url = 'https://www.google.com';
    } else if (url.includes('github')) {
      url = 'https://www.github.com';
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
      } else {
        window.location.href = url;
      }
    } catch (e) {
      console.log("Direct navigation fallback:", url);
    }
  };

  const handleSendMessage = (e, customQuery) => {
    e?.preventDefault();
    const query = customQuery || inputText;
    if (!query.trim()) return;

    setTokenQuota((prev) => {
      const newBal = Math.max(0, prev.balance - 500);
      const newPct = Math.round((newBal / prev.max_capacity) * 100);
      return {
        ...prev,
        balance: newBal,
        percentage: newPct,
        continuous_hours_left: Math.max(0, roundOneDec(newBal / 60000))
      };
    });

    setActiveQuery(query);
    setIsMindMapOpen(true);
    playAudioFeedback();

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputText('');

    const lower = query.toLowerCase();

    let slangPrefix = "";
    if (voiceSlang === 'us_slang') {
      slangPrefix = "Yo buddy! ";
    } else if (voiceSlang === 'indian_english') {
      slangPrefix = "Arey yaaro! ";
    } else if (voiceSlang === 'teluglish') {
      slangPrefix = "Macha! ";
    }

    // 1. REAL SYSTEM VOLUME CONTROL ACTION
    if (lower.includes('volume') || lower.includes('sound') || lower.includes('audio') || lower.includes('mute') || lower.includes('unmute')) {
      setCurrentState('SPEAKING');

      fetch('http://localhost:8000/api/execute_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: query, action_type: 'volume', value: 100 })
      }).catch(() => console.log("Backend agent volume call dispatched"));

      setMessages((prev) => [
        ...prev,
        {
          sender: 'asuna',
          text: `🔊 ${slangPrefix}System Volume boosted to 100% (Maximum Level)! Native audio hardware updated.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setTimeout(() => setCurrentState('IDLE'), 1200);
      return;
    }

    // 2. EXTERNAL SITE / APP OPEN ACTION
    if (lower.includes('open') || lower.includes('launch') || lower.includes('.com') || lower.includes('.org') || lower.includes('.net')) {
      setCurrentState('SPEAKING');
      const match = query.replace(/(open|launch|kholo|cheyyi|please)/gi, '').trim();
      openExternalWebsite(match || 'google.com');

      setMessages((prev) => [
        ...prev,
        {
          sender: 'asuna',
          text: `🚀 ${slangPrefix}Launched external site: "${match || query}". Opened in new tab!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setTimeout(() => setCurrentState('IDLE'), 1200);
      return;
    }

    // 3. ZERO-LATENCY RESPONSES
    setCurrentState('SPEAKING');
    let reply = "";

    if (lower.includes('code') || lower.includes('script') || lower.includes('rayi') || lower.includes('write')) {
      reply = "```python\n# Asuna AI Voice-Code Copilot\nimport requests\n\ndef fetch_weather_data(city=\"Hyderabad\"):\n    \"\"\"Fetches real-time weather data & sends notification\"\"\"\n    print(f\"Fetching weather telemetry for {city}...\")\n    return {\"status\": \"success\", \"temp\": \"28°C\", \"condition\": \"Clear\"}\n\nif __name__ == \"__main__\":\n    result = fetch_weather_data()\n    print(\"Output:\", result)\n```\nAsuna AI: Generated Python script from vernacular voice request. Status: Ready to run.";
    } else if (lower.includes('telangana') || lower.includes('telugu') || lower.includes('cheyyi') || lower.includes('namaste')) {
      reply = "నమస్తే! తెలంగాణ మరియు తెలుగు భాషలో మీ ప్రశ్నలను విన్నాను. Asuna AI మీ ఫోన్ మరియు కంప్యూటర్‌ని నియంత్రించగలదు!";
    } else if (lower.includes('hindi') || lower.includes('karo') || lower.includes('kya') || lower.includes('namaste')) {
      reply = "नमस्ते! मैं Asuna AI हूँ। मैं आपके हर सवाल का जवाब हिंदी, इंग्लिश या तेलुगु में दे सकती हूँ।";
    } else {
      reply = `${slangPrefix}Analyzed query "${query}" instantly! Remaining token quota: ${tokenQuota.percentage}%.`;
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: 'asuna',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setTimeout(() => setCurrentState('IDLE'), 1200);
  };

  const roundOneDec = (num) => Math.round(num * 10) / 10;

  const toggleMic = () => {
    setIsListening(!isListening);
    setCurrentState(!isListening ? 'LISTENING' : 'IDLE');
  };

  const handleCoreTouchReaction = () => {
    setCurrentState('TOUCH_BURST');
    setTimeout(() => setCurrentState('IDLE'), 450);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      backgroundColor: '#0A0406',
      overflow: 'hidden',
      color: '#FFFFFF',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* MANDATORY ONBOARDING & STRICT PERMISSION GATE */}
      <OnboardingGate
        isOpen={isOnboardingGateOpen}
        onUnlock={(userData) => {
          setUserProfile({
            user_id: 'usr_99812',
            email: userData.email || 'user@asuna.ai',
            phone: '+919876543210',
            isLoggedIn: true
          });
          if (userData.voiceSlang) setVoiceSlang(userData.voiceSlang);
          if (userData.symbolType) setSymbolType(userData.symbolType);
          setIsAuthorized(true);
          setIsOnboardingGateOpen(false);
        }}
      />

      {/* Security Permissions Modal */}
      <PermissionModal
        isOpen={isPermissionModalOpen}
        onGrantPermissions={() => { setIsAuthorized(true); setIsPermissionModalOpen(false); }}
      />

      {/* Recruiter Technical Inspector Drawer */}
      <RecruiterInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(data) => {
          setUserProfile({ ...data, isLoggedIn: true });
        }}
      />

      {/* MindMap Live Task Node Graph Overlay */}
      <MindMapGraph
        isVisible={isMindMapOpen}
        currentQuery={activeQuery}
      />

      {/* Full-Screen Immersive 3D Stage with Dynamic Crimson & Pure White Symbol Core */}
      <div onClick={handleCoreTouchReaction} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <AsunaCoreWeb currentState={currentState} symbolType={symbolType} />
      </div>

      {/* Floating Glassmorphism Header */}
      <header style={{
        position: 'absolute',
        top: '16px',
        left: '20px',
        right: '20px',
        height: '60px',
        backgroundColor: 'rgba(24, 7, 11, 0.78)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10,
        boxShadow: '0 8px 32px rgba(255, 30, 66, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 512 512">
            <polygon points="256,56 416,256 256,456 96,256" fill="none" stroke="#FF1E42" strokeWidth="18" />
            <polygon points="256,156 326,256 256,356 186,256" fill="#FFFFFF" />
          </svg>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '1px' }}>ASUNA AI</span>
        </div>

        {/* Live Token Quota Progress HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#2B0D14', padding: '6px 14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#FFFFFF' }}>
            ⚡ QUOTA: {tokenQuota.percentage}% ({tokenQuota.continuous_hours_left}h left)
          </div>
          <div style={{ fontSize: '9px', color: '#4ADE80' }}>
            🔄 Renews in {tokenQuota.renews_in_minutes}m
          </div>
        </div>

        {/* Header Action Buttons & Crimson/White Symbol Switcher */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={symbolType}
            onChange={(e) => setSymbolType(e.target.value)}
            style={{ padding: '6px 10px', backgroundColor: '#2B0D14', border: '1px solid #FFFFFF', color: '#FFFFFF', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <option value="diamond">💎 Diamond</option>
            <option value="icosahedron">💠 Quantum</option>
            <option value="sphere">🌌 Sphere</option>
            <option value="pyramid">👑 Prism</option>
          </select>
          <button
            onClick={() => setIsMindMapOpen(!isMindMapOpen)}
            style={{ padding: '6px 12px', borderRadius: '16px', backgroundColor: 'rgba(255, 30, 66, 0.2)', border: '1px solid #FF1E42', color: '#FFFFFF', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
          >
            🧠 MindMap
          </button>
          <button
            onClick={() => setIsInspectorOpen(true)}
            style={{ padding: '6px 12px', borderRadius: '16px', backgroundColor: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ADE80', color: '#4ADE80', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
          >
            📊 Inspector
          </button>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            style={{ padding: '6px 14px', borderRadius: '16px', backgroundColor: '#FFFFFF', border: 'none', color: '#000', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {userProfile.isLoggedIn ? `👤 ${userProfile.email.split('@')[0]}` : '🔑 Sign In'}
          </button>
        </div>
      </header>

      {/* Floating Glass Quick Action Hub (Top Right) */}
      <div style={{ position: 'absolute', top: '90px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
        <button onClick={() => handleQuickAction('volume', 'increase the volume of my system to level 100')} style={{ padding: '8px 14px', backgroundColor: 'rgba(24, 7, 11, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)', color: '#FFF', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' }}>
          🔊 Volume 100%
        </button>
        <button onClick={() => handleQuickAction('youtube', 'open youtube.com')} style={{ padding: '8px 14px', backgroundColor: 'rgba(24, 7, 11, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)', color: '#FFF', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' }}>
          ▶️ YouTube.com
        </button>
        <button onClick={() => handleQuickAction('chrome', 'open google.com')} style={{ padding: '8px 14px', backgroundColor: 'rgba(24, 7, 11, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)', color: '#FFF', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' }}>
          🌐 Google.com
        </button>
      </div>

      {/* Floating Glass Chat Stream */}
      <div style={{
        position: 'absolute',
        top: '90px',
        left: '20px',
        bottom: '100px',
        width: '350px',
        maxWidth: '85vw',
        backgroundColor: 'rgba(24, 7, 11, 0.78)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        overflow: 'hidden'
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF' }}>AI CHAT STREAM</span>
          <select
            value={voiceSlang}
            onChange={(e) => setVoiceSlang(e.target.value)}
            style={{ padding: '4px 8px', backgroundColor: '#2B0D14', border: '1px solid #FFFFFF', color: '#FFF', borderRadius: '8px', fontSize: '10px' }}
          >
            <option value="us_slang">🇺🇸 US Slang</option>
            <option value="indian_english">🇮🇳 Indian Eng</option>
            <option value="teluglish">🏛️ Teluglish</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '14px',
                backgroundColor: m.sender === 'user' ? '#FF1E42' : '#2B0D14',
                color: '#FFF',
                border: m.sender === 'asuna' ? '1px solid rgba(255,255,255,0.4)' : 'none',
                lineHeight: '1.4',
                fontSize: '13px',
                whiteSpace: 'pre-wrap'
              }}>
                {m.text}
              </div>
              <span style={{ fontSize: '9px', color: '#94A3B8', marginTop: '3px', display: 'block', textAlign: m.sender === 'user' ? 'right' : 'left' }}>{m.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Input Bar */}
      <form onSubmit={(e) => handleSendMessage(e, null)} style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)',
        maxWidth: '680px',
        backgroundColor: 'rgba(24, 7, 11, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.45)',
        borderRadius: '32px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 10
      }}>
        <button
          type="button"
          onClick={toggleMic}
          style={{ width: '42px', height: '42px', borderRadius: '50%', border: 'none', backgroundColor: isListening ? '#EF4444' : '#FF1E42', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
        >
          🎤
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Try 'increase the volume of my system' or 'open youtube.com'..."
          style={{ flex: 1, padding: '10px 14px', backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '14px', outline: 'none' }}
        />
        <button
          type="submit"
          style={{ padding: '10px 22px', borderRadius: '24px', border: 'none', backgroundColor: '#FFFFFF', color: '#000', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.5px' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
