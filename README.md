# Arundas Ramadasan — Portfolio

A personal portfolio built with the **iOS 26 Liquid Glass** design system, using official design tokens from [`@ios26_design_system/tokens`](https://github.com/seunghan91/ios26-design-system).

## Features

- Liquid Glass materials with frosted blur and specular highlights
- iOS 26 typography scale (SF Pro)
- Floating tab bar with morphing indicator (scroll-to-hide behavior)
- Light / dark / system theme toggle
- Single-page scroll layout with smooth section navigation
- **Faith Discuss** floating chatbot — scripture Q&A from Bible, Quran, and Hindu texts
- Contact links via email, LinkedIn, and Instagram

## Getting Started

```bash
npm install
cp .env.example .env
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Faith Discuss chat (optional)

The chat widget calls a **local FastAPI backend** on port `8000`. It will not reply until both steps below are done.

**1. Frontend** (from repo root):

```bash
cp .env.example .env   # optional; defaults to http://localhost:8000
npm start
```

**2. Backend** (separate terminal):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and set your keys:

```
OPENAI_API_KEY=sk-...
CHAT_ACCESS_PASSWORD=your-static-chat-password
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Verify setup:

```bash
curl http://localhost:8000/api/health
# {"status":"ok","openai_configured":true,...}
```

**Common local issues**

| Symptom | Cause | Fix |
|--------|--------|-----|
| `ModuleNotFoundError: No module named 'a2p_regulatory'` | MCP package not installed in venv | `cd backend && .venv/bin/pip install -r requirements.txt` |
| `Address already in use` on port 8000 | Old uvicorn still running | `lsof -ti :8000 \| xargs kill -9` then restart |
| `OPENAI_API_KEY is not configured` | Missing `backend/.env` | Add key to `backend/.env` and restart uvicorn |
| Network error / CORS in browser | Backend not running, or wrong port | Run uvicorn on port 8000; check `REACT_APP_CHAT_API_URL` |
| Works on desktop but not phone on Wi‑Fi | CORS blocked LAN origin | Use `localhost` on the same machine, or restart backend after pulling latest CORS config |

For production, deploy the backend to **Render** (see below).

### Deploy API to Render

The repo includes a [`render.yaml`](render.yaml) blueprint for the FastAPI backend in `backend/`.

**1. Push this repo to GitHub** (if not already).

**2. Create the Render service**

- Go to [render.com](https://render.com) → **New** → **Blueprint**
- Connect the `arundas1903/portfolio` repository
- Render will detect `render.yaml` and create or sync **`portfolio-faith-api`**
- When prompted, set **`OPENAI_API_KEY`** (mark as secret)
- Deploy and wait for the service to go live
- Add custom domain **`api.arundas.me`** in Render → **Settings** → **Custom Domains** (DNS CNAME to your Render target)

**3. Verify the API**

```bash
curl https://api.arundas.me/api/health
# {"status":"ok","openai_configured":true,"model":"gpt-4o-mini"}
```

**4. Wire the portfolio frontend**

Add a GitHub repository secret:

- **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
- Name: `REACT_APP_CHAT_API_URL`
- Value: `https://api.arundas.me` (no trailing slash)

Set **`CHAT_ACCESS_PASSWORD`** in the Render dashboard (Environment) to your static chat password. Users must enter this in the portfolio chat widget before Faith Discuss unlocks.

Re-run the **Deploy to GitHub Pages** workflow (or push to `main`). The production build embeds this API URL so the portfolio on [arundas.me](https://arundas.me) calls your API.

**Notes**

- Free Render services spin down after inactivity; the first request after idle may take ~30s (cold start).
- CORS already allows `https://arundas.me` and `https://www.arundas.me`.
- Public API docs: `https://api.arundas.me/docs` (BFSI notification + Payment network APIs).
- To redeploy the API, push to `main` — Render auto-deploys from GitHub.

## Build

```bash
npm run build
```

## Tech Stack

- React 18 + TypeScript
- Framer Motion
- @ios26_design_system/tokens
