# Deploying Asuna AI (Render Backend + Vercel Frontend)

This guide walks you through fixing request/response errors and deploying Asuna AI publicly.

---

## 1. Backend Setup on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New → Blueprint** (or **Web Service**).
2. Connect your GitHub repository (`GSampathChary/ASUNA-AI`).
3. Render will read `render.yaml` and configure the service:
   - **Root Directory**: `backend/fastapi`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set your Environment Variables in Render:
   - `GEMINI_API_KEY`: Your Google Gemini API Key (or `OPENAI_API_KEY` if using OpenAI).
   - `GEMINI_MODEL`: leave blank, or use `gemini-3.5-flash`. If the configured model is unavailable, Asuna queries Gemini for a model available to this API key.
   - `CORS_ALLOW_ORIGINS`: Set to your Vercel URL (e.g. `https://asuna-ai.vercel.app`) or leave blank to automatically allow Vercel origins.
5. Deploy the service and copy your public Render URL (e.g. `https://asuna-ai-api.onrender.com`).

---

## 2. Frontend Setup on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New → Project**.
2. Import your GitHub repository (`GSampathChary/ASUNA-AI`).
3. Set **Root Directory** to `apps/web/asuna-web`.
4. Under **Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your actual Render backend URL (e.g., `https://asuna-ai-api.onrender.com`)
5. Click **Deploy**.

---

## 3. Why Requests Were Failing & How It Is Fixed

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Dead/Mismatched Backend URL** | Frontend was pointing to a hardcoded placeholder Render URL (`asuna-ai-7xaz.onrender.com`). | Updated `App.jsx` and `vercel.json` to prioritize `VITE_API_BASE_URL`. |
| **CORS Blocked Requests** | Render backend was only allowing one specific hardcoded Vercel URL. | Updated `main.py` CORS middleware to automatically match Vercel subdomains (`*.vercel.app`) and custom `CORS_ALLOW_ORIGINS`. |
| **Render Cold Start Delays** | Free Render instances sleep after 15 mins of inactivity, taking ~45s to respond when woken up. | Added automatic retries with user status feedback ("Server is waking up on Render (free tier), retrying…") in `App.jsx`. |
| **Gemini API Error** | Key or model name mismatch caused silent failure. | Added model fallback (`gemini-2.0-flash` → `gemini-1.5-flash`) and descriptive HTTP error responses in `provider.py`. |

---

## Verification & Testing

1. Open your Render API URL directly in the browser (`https://your-render-app.onrender.com/health`). You should see:
   ```json
   {"status": "healthy", "provider_configured": true}
   ```
2. Open your Vercel URL, type a prompt (e.g. "Hello Asuna"), and click **Send**.
3. If the server was sleeping, wait ~30 seconds for the first request while Render boots up. Subsequent requests will be instant!

---

## 4. JARVIS device pairing and remote control

Set a strong random `ASUNA_AGENT_TOKEN` in Render and in your local `.env`. This is a pairing secret, not an email password: do not put it in `VITE_*` variables or commit it to Git.

Start the backend locally:

```powershell
cd backend\fastapi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Start the web HUD in another terminal:

```powershell
cd apps\web\asuna-web
npm install
$env:VITE_API_BASE_URL="http://localhost:8000"
npm run dev
```

Open the HUD, choose the same account email on every device, and select **Pair device**. Enter the server's pairing token. It is held only for the current browser session.

Start the Windows agent in a third terminal:

```powershell
cd E:\AI-Portfolio\Projects\asuna-ai
$env:ASUNA_USER_EMAIL="yourname@gmail.com"
$env:ASUNA_WS_URL="ws://localhost:8000/ws"
$env:ASUNA_AGENT_TOKEN="the-same-long-random-token"
$env:ASUNA_DEVICE_ID="my-windows-laptop"
python -m agents.windows.main
```

For deployed services use `wss://your-render-domain/ws` for `ASUNA_WS_URL`. Render free instances may sleep, which makes persistent WebSocket device routing unsuitable; use an always-on WebSocket-capable host for dependable remote control.

Supported Windows actions are opening YouTube/browser and exact system volume (requires `pycaw`, installed through the backend requirements on Windows).

### Android companion app (recommended)

The native Android companion can receive paired actions for flashlight, media volume, and launching YouTube or Chrome. It must remain open in the foreground while serving as an agent; Android does not permit a normal app to keep a permanent network connection in the background without a user-visible foreground service.

```powershell
cd E:\AI-Portfolio\Projects\asuna-ai\apps\mobile\flutter
flutter doctor
flutter pub get
flutter devices
flutter run --release
```

If `flutter build apk` reports `deleted Android v1 embedding`, remove the obsolete local file left by an older project template, then rebuild:

```powershell
Remove-Item .\android\app\src\main\java\io\flutter\plugins\GeneratedPluginRegistrant.java -Force -ErrorAction SilentlyContinue
flutter clean
flutter pub get
flutter build apk --release
```

Enable **Developer options → USB debugging** on the Android phone before using `flutter run`; accept the USB-debugging prompt when it appears. On first launch, tap the link icon, enter `wss://your-backend-domain/ws`, your account email, and your pairing token. Approve camera permission the first time you use flashlight. Use a deployed `wss://` endpoint for a real phone; `localhost` points to the phone itself, not your laptop.

Once both devices show as paired, use the web HUD or mobile app with the same account email:

```text
Jarvis, open YouTube on my laptop
Jarvis, set volume to 80% on my PC
Jarvis, turn on flashlight on my mobile
Jarvis, open YouTube on my mobile
```

The browser mobile agent remains a convenience fallback for opening web destinations and may control the torch only on compatible Android browsers. It cannot universally control iOS flashlight, phone volume, calls, or native apps.
