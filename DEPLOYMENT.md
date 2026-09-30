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
   - `GEMINI_MODEL`: `gemini-2.0-flash`. This is the compatible fallback if the configured Gemini model is not available to your API key.
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
