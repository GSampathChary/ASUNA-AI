# Asuna AI Ecosystem

Asuna AI is an advanced multimodal AI assistant supporting voice, vision, gesture recognition, cross-platform agents, and 3D visual effects.

## JARVIS cross-device control

The JARVIS interface can route an approved command to a paired Windows laptop or to the mobile web app. Pairing is required: matching an email address alone does not grant control.

1. Set a long, random `ASUNA_AGENT_TOKEN` in the backend environment. Keep it out of source control.
2. Start the backend and enter the same token through **Pair device** in every browser/device you want to use.
3. Start the Windows agent with the same email, WebSocket URL, and token. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact commands.

The browser-based mobile agent supports opening web destinations and, on compatible Android browsers over HTTPS, the camera-torch API. iOS and many browsers do not expose flashlight control to web apps; a native mobile app is required for universal flashlight, volume, calling, or camera control.
