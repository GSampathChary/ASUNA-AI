import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';

export function CameraGesturePanel({ onGesture, onCameraPose, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const frameRef = useRef(null);
  const lastGestureRef = useRef({ name: '', at: 0 });
  const [message, setMessage] = useState('Requesting camera permission…');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const detect = async () => {
      if (!active || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState >= 2 && landmarkerRef.current) {
        const result = landmarkerRef.current.detectForVideo(video, performance.now());
        const hand = result.landmarks?.[0];
        if (hand) {
          const thumb = hand[4];
          const index = hand[8];
          const middle = hand[12];
          const wrist = hand[0];

          // Compute head pose yaw/pitch from hand position in video frame
          const yaw = -(wrist.x - 0.5) * 1.6;
          const pitch = -(wrist.y - 0.5) * 1.2;
          onCameraPose?.({ yaw, pitch, roll: -yaw * 0.2 });

          const distance = Math.hypot(thumb.x - index.x, thumb.y - index.y);
          const twoFingerDistance = Math.hypot(index.x - middle.x, index.y - middle.y);
          const gesture = distance < 0.055 ? 'PINCH' : twoFingerDistance < 0.06 ? 'SCROLL' : null;
          if (gesture && (lastGestureRef.current.name !== gesture || Date.now() - lastGestureRef.current.at > 900)) {
            lastGestureRef.current = { name: gesture, at: Date.now() };
            onGesture(gesture);
          }
        }
      }
      frameRef.current = requestAnimationFrame(detect);
    };

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        if (!active) return;
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: 'VIDEO',
          numHands: 1,
        });
        setMessage('Camera active · face and hands track 3D Man model pose · pinch to select');
        detect();
      } catch (cause) {
        setError(cause.name === 'NotAllowedError' ? 'Camera permission was denied. You can enable it in browser settings.' : 'Camera setup failed. Check that you are using HTTPS or localhost.');
      }
    }
    start();
    return () => {
      active = false;
      cancelAnimationFrame(frameRef.current);
      landmarkerRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onGesture, onCameraPose]);

  return <section className="camera-panel" aria-label="Camera head & hand motion controls">
    <div className="panel-heading"><div><span className="eyebrow">CAMERA TRACKING</span><strong>Head & gesture tracking</strong></div><button className="icon-button" onClick={onClose} aria-label="Close camera">×</button></div>
    <video ref={videoRef} className="camera-feed" muted playsInline />
    <p className={error ? 'status-error' : 'status-text'}>{error || message}</p>
  </section>;
}
