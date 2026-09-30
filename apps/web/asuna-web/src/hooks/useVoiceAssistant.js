import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function useVoiceAssistant({ onCommand }) {
  const recognitionRef = useRef(null);
  const [status, setStatus] = useState(SpeechRecognition ? 'idle' : 'unsupported');
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (!SpeechRecognition) return undefined;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onstart = () => setStatus('listening');
    recognition.onend = () => setStatus((value) => value === 'stopping' ? 'idle' : value);
    recognition.onerror = (event) => setStatus(event.error === 'not-allowed' ? 'permission-denied' : 'error');
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) finalText += `${text} `;
        else interimText += `${text} `;
      }
      setTranscript((finalText || interimText).trim());
      if (finalText) {
        const command = finalText.replace(/^\s*(hey\s+)?asuna[,:]?\s*/i, '').trim();
        if (command) onCommand(command);
      }
    };
    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [onCommand]);

  const start = useCallback(() => {
    if (!recognitionRef.current || status === 'listening') return;
    setTranscript('');
    recognitionRef.current.start();
  }, [status]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    setStatus('stopping');
    recognitionRef.current.stop();
  }, []);

  return { status, transcript, start, stop, supported: Boolean(SpeechRecognition) };
}
