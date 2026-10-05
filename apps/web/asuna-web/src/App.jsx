import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AsunaCoreWeb } from './components/AsunaCoreWeb';
import { CameraGesturePanel } from './components/CameraGesturePanel';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import './asuna.css';

const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const welcomeMessage = (nickname) => ({ sender: 'asuna', text: `Hello${nickname ? `, ${nickname}` : ''}. Asuna is online. Pair this device to enable cross-device commands.`, time: clock() });
// In production on Vercel, /api is proxied to Render by vercel.json. This
// keeps the browser on one origin and prevents CORS from blocking chat.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '');
const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function requestChat(payload, sessionToken, onRetry) {
  const endpoints = API_BASE_URL
    ? [`${API_BASE_URL}/api/chat`]
    : ['/api/chat'];
  let lastError = new Error('The AI service is unavailable.');

  for (const endpoint of endpoints) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(sessionToken ? { 'X-Asuna-Session': sessionToken } : {}) },
          body: JSON.stringify(payload),
        });
        if (response.ok) return response.json();
        const error = await response.json().catch(() => ({}));
        lastError = new Error(error.detail || `AI service returned ${response.status}.`);
        if (![408, 429, 500, 502, 503, 504].includes(response.status)) throw lastError;
      } catch (error) {
        lastError = error;
      }
      if (attempt < 3) {
        onRetry?.(attempt + 1, attempt >= 1 ? 'Server is waking up on Render (free tier), retrying…' : 'Connecting to AI service…');
        await sleep((attempt + 1) * 1000);
      }
    }
  }
  throw lastError;
}

const socketUrl = () => {
  if (API_BASE_URL) return API_BASE_URL.replace(/^http/i, 'ws') + '/ws';
  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
};

const browserDeviceType = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'browser';

async function executeMobileAction(payload) {
  const { action, args = {}, command = '' } = payload;
  if (action === 'open_application' || action === 'open_browser') {
    const destination = /youtube/i.test(command) || /youtube/i.test(args.application || '')
      ? 'https://www.youtube.com' : (args.url || 'https://www.google.com');
    window.open(destination, '_blank', 'noopener,noreferrer');
    return;
  }
  if (action === 'toggle_flashlight') {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: args.state === 'on' }] });
    } finally {
      if (args.state !== 'on') stream.getTracks().forEach((item) => item.stop());
    }
  }
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export default function App() {
  const [nickname, setNickname] = useState(() => localStorage.getItem('asuna_user_nickname') || '');
  const [messages, setMessages] = useState(() => [welcomeMessage(localStorage.getItem('asuna_user_nickname') || '')]);
  const [input, setInput] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPose, setCameraPose] = useState(null);
  const [busy, setBusy] = useState(false);
  const [currentState, setCurrentState] = useState('IDLE');
  const [statusText, setStatusText] = useState('Asuna online');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('asuna_user_email') || '');
  const [targetDevice, setTargetDevice] = useState('local');
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [pairingToken, setPairingToken] = useState(() => sessionStorage.getItem('asuna_pairing_token') || '');
  const [sessionToken, setSessionToken] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const messagesEndRef = useRef(null);


  const deviceIdRef = useRef(sessionStorage.getItem('asuna_device_id') || `web_${crypto.randomUUID()}`);
  useEffect(() => { sessionStorage.setItem('asuna_device_id', deviceIdRef.current); }, []);

  useEffect(() => {
    if (!pairingToken || !userEmail) return undefined;
    const socket = new WebSocket(socketUrl());
    socket.onopen = () => socket.send(JSON.stringify({
      type: 'agent_register', email: userEmail, device_type: browserDeviceType(),
      device_id: deviceIdRef.current, pairing_token: pairingToken,
    }));
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'registered') {
        setSessionToken(message.session_token);
        setStatusText('Asuna online');
      }
      if (message.type === 'device_network_update') setConnectedDevices(message.connected_devices || []);
      if (message.type === 'remote_action' && browserDeviceType() === 'mobile') {
        try { await executeMobileAction(message); }
        catch (error) { console.warn('Mobile action could not run:', error); }
      }
    };
    socket.onclose = () => setSessionToken('');
    return () => socket.close();
  }, [pairingToken, userEmail]);

  // REST fallback for device status; WebSocket updates are immediate.
  useEffect(() => {
    let active = true;
    const fetchDevices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/devices/connected?email=${encodeURIComponent(userEmail)}`, {
          headers: sessionToken ? { 'X-Asuna-Session': sessionToken } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (active) setConnectedDevices(data.connected_devices || []);
        }
      } catch (err) {
        // Standby
      }
    };
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [userEmail, sessionToken]);

  const send = useCallback(async (rawText) => {
    const text = rawText.trim();
    if (!text || busy) return;
    const pendingId = `pending-${Date.now()}`;
    setMessages((current) => [...current, { sender: 'user', text, time: clock() }]);
    setMessages((current) => [...current, { id: pendingId, sender: 'asuna', text: 'Asuna is processing…', time: clock(), pending: true }]);
    setInput('');
    setBusy(true);
    setCurrentState('THINKING');
    setStatusText('Processing…');
    try {
      const data = await requestChat(
        {
          message: text,
          history: messages.filter((message) => !message.pending).slice(-8).map(({ sender, text: item }) => ({ role: sender === 'asuna' ? 'assistant' : 'user', content: item })),
          client_time: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          user_email: userEmail,
          user_nickname: nickname,
          target_device: targetDevice,
        }, sessionToken,
        (_attempt, msg) => {
          setCurrentState('THINKING');
          if (msg) setStatusText(msg);
        },
      );
      const reply = data.reply || `I could not generate a response${nickname ? `, ${nickname}` : ''}.`;
      setMessages((current) => current.map((message) => (
        message.id === pendingId ? { ...message, text: reply, time: clock(), pending: false } : message
      )));
      setCurrentState('SPEAKING');
      setStatusText('Asuna online');
      speak(reply);
    } catch (error) {
      const reply = `I could not execute your request${nickname ? `, ${nickname}` : ''}, because ${error.message || 'the neural gateway is unreachable'}.`;
      setMessages((current) => current.map((message) => (
        message.id === pendingId ? { ...message, text: reply, time: clock(), pending: false } : message
      )));
      setCurrentState('ERROR');
      setStatusText('Gateway offline');
    } finally {
      setBusy(false);
      window.setTimeout(() => {
        setCurrentState('IDLE');
        setStatusText('Asuna online');
      }, 1500);
    }
  }, [busy, messages, userEmail, nickname, targetDevice, sessionToken]);

  const voice = useVoiceAssistant({ onCommand: send });
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const changeProfile = () => {
    const newEmail = prompt('Enter your account email (use the same email on Laptop & Mobile for cross-device control):', userEmail);
    if (newEmail && newEmail.includes('@')) {
      const nextNickname = prompt('Enter the nickname Asuna should use for you:', nickname || newEmail.split('@')[0]);
      if (!nextNickname?.trim()) return;
      const cleanEmail = newEmail.trim();
      const cleanNickname = nextNickname.trim().slice(0, 40);
      setUserEmail(cleanEmail);
      setNickname(cleanNickname);
      localStorage.setItem('asuna_user_email', cleanEmail);
      localStorage.setItem('asuna_user_nickname', cleanNickname);
      setMessages((current) => [...current, welcomeMessage(cleanNickname)]);
      setSessionToken('');
    }
  };

  const pairDevice = () => {
    const token = prompt('Enter the pairing token configured as ASUNA_AGENT_TOKEN on your backend:', '');
    if (!token) return;
    sessionStorage.setItem('asuna_pairing_token', token.trim());
    setPairingToken(token.trim());
    setStatusText('Pairing device…');
  };

  const onGesture = useCallback((gesture) => {
    if (gesture === 'PINCH') send('select the current item');
    if (gesture === 'SCROLL') window.scrollBy({ top: 300, behavior: 'smooth' });
  }, [send]);

  const reactToCore = useCallback((state, timeout = 550) => {
    setCurrentState(state);
    window.setTimeout(() => setCurrentState('IDLE'), timeout);
  }, []);

  const voiceLabel = !voice.supported ? 'Voice unavailable in this browser' : voice.status === 'listening' ? 'Listening — say “Asuna” then your request' : voice.status === 'permission-denied' ? 'Microphone permission was denied' : 'Asuna voice standby';

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark" aria-hidden="true" /><span>ASUNA OS</span></div>
      <div className="topbar-actions">
        <button className="outline-button" onClick={changeProfile} title="Set your account email and nickname">👤 {nickname || 'Set profile'}</button>
        <button className="outline-button" onClick={pairDevice} title="Pair this device securely">{sessionToken ? '✓ Paired' : '🔗 Pair device'}</button>
        <button className="outline-button" onClick={() => alert(`Connected Devices on ${userEmail}:\n` + (connectedDevices.map(d => `• ${d.device_type.toUpperCase()} (${d.status})`).join('\n') || '• Browser (Current)\n• Laptop Agent (Offline - Run agents/windows/main.py)'))}>
          🌐 Devices ({connectedDevices.length || 1})
        </button>
        {installPrompt && <button className="outline-button" onClick={installApp}>↓ Install app</button>}
        <button className="outline-button" onClick={() => setCameraOpen((open) => !open)}>📷 {cameraOpen ? 'Camera on' : 'Enable camera'}</button>
      </div>
    </header>
    <div className="main-grid">
      <section className="chat-card" aria-label="Asuna conversation">
        <div className="card-header">
          <div><span className="eyebrow">ASUNA NEURAL NET{nickname ? ` · ${nickname.toUpperCase()}` : ''}</span><strong>{statusText}</strong></div>
          <div className="target-selector" style={{ display: 'flex', gap: '4px' }}>
            <button className={`outline-button ${targetDevice === 'local' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '2px 6px' }} onClick={() => setTargetDevice('local')}>⚡ Auto</button>
            <button className={`outline-button ${targetDevice === 'laptop' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '2px 6px' }} onClick={() => setTargetDevice('laptop')}>💻 Laptop</button>
            <button className={`outline-button ${targetDevice === 'mobile' ? 'active' : ''}`} style={{ fontSize: '11px', padding: '2px 6px' }} onClick={() => setTargetDevice('mobile')}>📱 Mobile</button>
          </div>
        </div>
        <div className="messages">{messages.map((message, index) => <article className={`message ${message.sender === 'user' ? 'user' : ''} ${message.pending ? 'pending' : ''}`} key={message.id || `${message.time}-${index}`}>{message.text}<time>{message.time}</time></article>)}<div ref={messagesEndRef} /></div>
        <form className="composer" onSubmit={(event) => { event.preventDefault(); send(input); }}><input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Ask Asuna" placeholder="Say 'Asuna, open YouTube on my laptop'…" /><button className="send-button" type="submit" disabled={busy}>{busy ? 'Processing…' : 'Send'}</button></form>
      </section>
      <section className="stage" aria-label="Asuna controls">
        {cameraOpen && <CameraGesturePanel onGesture={onGesture} onCameraPose={setCameraPose} onClose={() => setCameraOpen(false)} />}
        <div className="stage-kicker"><span className="eyebrow">{nickname ? `${nickname.toUpperCase()}'S PERSONAL AI` : 'YOUR PERSONAL AI'}</span><strong>ASUNA INTERACTIVE CORE</strong></div>
        <div className="core-visual"><AsunaCoreWeb currentState={voice.status === 'listening' ? 'LISTENING' : currentState} cameraPose={cameraPose} symbolType="humanoid" onClick={() => reactToCore('TOUCH_BURST')} onWheel={() => reactToCore('SCROLLING', 700)} /></div>
        <div className="assistant-status"><div className="assistant-copy"><h1>Ask naturally.<br />Control cross-device.</h1><p>{voice.transcript || voiceLabel}</p><div className="control-row"><button className={`primary-button ${voice.status === 'listening' ? 'active' : ''}`} disabled={!voice.supported} onClick={voice.status === 'listening' ? voice.stop : voice.start}>{voice.status === 'listening' ? '■ Stop listening' : '🎙 Start Asuna voice'}</button><button className="outline-button" onClick={() => setCameraOpen(true)}>✋ Camera tracking</button></div><p className="capability">Set your email and nickname to personalize Asuna and link your devices.</p></div></div>
        <p className="privacy-note">Remote execution requires a paired device.<br />{nickname ? `Profile: ${nickname} · ` : ''}Account: {userEmail || 'Not set'}.</p>
      </section>
    </div>
  </main>;
}
