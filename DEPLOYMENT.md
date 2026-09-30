# Deploy Asuna AI

The repository is configured for a static Vite frontend and a FastAPI API.

## 1. Create the API on Render

1. In Render, select **New** then **Blueprint**.
2. Connect `GSampathChary/ASUNA-AI` and select the `main` branch.
3. Render reads `render.yaml` and proposes the `asuna-ai-api` service.
4. Enter values for the requested secrets:
   - `GEMINI_API_KEY`: server-only Gemini API key (recommended if using Gemini). Configure `OPENAI_API_KEY` instead only if using OpenAI.
   - `ASUNA_AGENT_TOKEN`: a long random value reserved for a later paired desktop/mobile agent.
   - `CORS_ALLOW_ORIGINS`: leave blank for the first deploy, then set it after the frontend URL exists.
5. Create the Blueprint and wait for the health check to pass.
6. Copy the public Render URL, such as `https://asuna-ai-api.onrender.com`.

## 2. Deploy the frontend (choose one)

### Vercel

1. Import the GitHub repository.
2. Set **Root Directory** to `apps/web/asuna-web`.
3. Vercel reads `vercel.json`; it builds with `npm run build` and publishes `dist`.
4. No frontend API variable is required on Vercel: `vercel.json` proxies `/api/*` to Render. If you set `VITE_API_BASE_URL`, it overrides that proxy and must contain only the public Render URL.
5. Deploy, then copy the `vercel.app` URL.

### Cloudflare Pages

1. In **Workers & Pages**, create a Pages project from the GitHub repository.
2. Set **Root Directory** to `apps/web/asuna-web`.
3. Use `npm run build` as the build command and `dist` as the output directory. `wrangler.toml` records the output directory for CLI-based deployment too.
4. Add `VITE_API_BASE_URL` with the Render URL. Cloudflare Pages does not use the Vercel proxy.
5. Deploy, then copy the `pages.dev` URL.

## 3. Lock down the API

In the Render service, set `CORS_ALLOW_ORIGINS` to the exact deployed frontend address or addresses, for example:

```text
https://your-project.vercel.app,https://your-project.pages.dev
```

Save and redeploy Render. Do not use `*` with credentialed browser requests.

## Verification

1. Visit the Render `/` endpoint and confirm it returns `"status": "online"`.
2. Visit the deployed frontend and send a question.
3. Confirm the browser sends the request to the Render URL in Developer Tools → Network.
4. Confirm camera and microphone consent prompts work over HTTPS.

## Security notes

- Keep `OPENAI_API_KEY` and `ASUNA_AGENT_TOKEN` only in Render secrets. Never add them to Git or a `VITE_*` variable.
- The API has a small in-memory public rate limit as a first guard. Add real user authentication and persistent rate limiting before inviting broad public traffic.
- Free Render web services can sleep after inactivity. Free frontend hosts do not run a 24/7 background assistant. Always-on wake word requires the native agent described in `docs/architecture/always-on-assistant.md`.
