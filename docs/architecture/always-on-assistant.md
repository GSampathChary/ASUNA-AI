# Always-on Asuna architecture

## What remains active

A browser tab cannot listen after it is closed or reliably keep microphone access in the background. Always-on use therefore belongs to an installed, user-visible agent:

```text
Wake-word service (desktop / Android foreground service)
  -> speech-to-text
  -> authenticated local agent session
  -> FastAPI planner and AI provider
  -> explicit confirmation for sensitive actions
  -> text-to-speech response
```

## Desktop

Package the Windows agent as a tray application or service. It should show a microphone-in-use indicator, offer Pause and Quit controls, store a paired-device token in the OS credential store, and reconnect only to the configured local/backend endpoint. The agent must only execute actions returned by the policy/confirmation layer.

## Android

Use a foreground service for listening, with a persistent notification and a clear stop control. Request microphone and camera permissions just before use. Accessibility automation is optional, must be prominently disclosed, and must be used only for its declared accessibility purpose.

## iOS

Provide voice, camera gestures, notifications, and app-local actions. Do not advertise universal background wake-word listening or control of other apps: iOS sandboxing does not permit it.

## Pairing and safety

1. User signs in on the UI and chooses **Connect this device**.
2. The app displays a one-time code or QR code.
3. The installed agent exchanges it for a device-scoped, revocable token.
4. The API accepts device actions only with that token.
5. High-impact actions remain confirmation-gated and every action is recorded in an audit log.
