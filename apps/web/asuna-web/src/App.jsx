import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CameraGesturePanel } from './components/CameraGesturePanel';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import './asuna.css';

const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const initialMessages = [{ sender: 'asuna', text: 'Namaste — I am ready when you are. You can type, use voice, or enable camera gestures.', time: clock() }];
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export default function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef(null);

  const send = useCallback(async (rawText) => {
    const text = rawText.trim();
    if (!text || busy) return;
    setMessages((current) => [...current, { sender: 'user', text, time: clock() }]);
    setInput('');
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.slice(-8).map(({ sender, text: item }) => ({ role: sender === 'asuna' ? 'assistant' : 'user', content: item })) }),
      });
      if (!response.ok) throw new Error('The local AI service is unavailable.');
      const data = await response.json();
      const reply = data.reply || 'I could not generate a response.';
      setMessages((current) => [...current, { sender: 'asuna', text: reply, time: clock() }]);
      speak(reply);
    } catch {
      const reply = 'I cannot reach the local AI service yet. Start the FastAPI backend, then add an AI provider key for full answers.';
      setMessages((current) => [...current, { sender: 'asuna', text: reply, time: clock() }]);
    } finally { setBusy(false); }
  }, [busy, messages]);

  const voice = useVoiceAssistant({ onCommand: send });
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const onGesture = useCallback((gesture) => {
    if (gesture === 'PINCH') send('select the current item');
    if (gesture === 'SCROLL') window.scrollBy({ top: 300, behavior: 'smooth' });
  }, [send]);

  const voiceLabel = !voice.supported ? 'Voice unavailable in this browser' : voice.status === 'listening' ? 'Listening — say “Asuna” then your request' : voice.status === 'permission-denied' ? 'Microphone permission was denied' : 'Voice is off';

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark" aria-hidden="true" /><span>ASUNA AI</span></div>
      <div className="topbar-actions"><button className="outline-button" onClick={() => setCameraOpen((open) => !open)}>📷 {cameraOpen ? 'Camera on' : 'Enable camera'}</button><button className="outline-button" onClick={() => alert('Desktop/Android agent pairing will be added here. This browser can only access the camera, microphone, and browser features you grant.')}>⌘ Device access</button></div>
    </header>
    <div className="main-grid">
      <section className="chat-card" aria-label="Asuna conversation">
        <div className="card-header"><div><span className="eyebrow">CONVERSATION</span><strong>{busy ? 'Thinking…' : 'Ready to help'}</strong></div><span className="capability">Private by default</span></div>
        <div className="messages">{messages.map((message, index) => <article className={`message ${message.sender === 'user' ? 'user' : ''}`} key={`${message.time}-${index}`}>{message.text}<time>{message.time}</time></article>)}<div ref={messagesEndRef} /></div>
        <form className="composer" onSubmit={(event) => { event.preventDefault(); send(input); }}><input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Ask Asuna" placeholder="Ask anything…" /><button className="send-button" type="submit" disabled={busy}>Send</button></form>
      </section>
      <section className="stage" aria-label="Asuna controls">
        {cameraOpen && <CameraGesturePanel onGesture={onGesture} onClose={() => setCameraOpen(false)} />}
        <div className="assistant-status"><div className={`orb ${voice.status === 'listening' ? 'listening' : ''}`} aria-hidden="true" /><div className="assistant-copy"><span className="eyebrow">YOUR MULTIMODAL ASSISTANT</span><h1>Ask naturally.<br />Act deliberately.</h1><p>{voice.transcript || voiceLabel}</p><div className="control-row"><button className={`primary-button ${voice.status === 'listening' ? 'active' : ''}`} disabled={!voice.supported} onClick={voice.status === 'listening' ? voice.stop : voice.start}>{voice.status === 'listening' ? '■ Stop listening' : '🎙 Start voice'}</button><button className="outline-button" onClick={() => setCameraOpen(true)}>✋ Hand gestures</button></div><p className="capability">Browser: voice and camera only · Desktop/Android agent: device actions after pairing</p></div></div>
        <p className="privacy-note">You can stop voice or camera at any time.<br />Asuna never claims access it does not have.</p>
      </section>
    </div>
  </main>;
}
