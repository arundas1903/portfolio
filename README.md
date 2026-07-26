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

The chat section requires the Python backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

For production, deploy the backend (e.g. Railway, Render) and set `REACT_APP_CHAT_API_URL` to your API URL when building the frontend.

## Build

```bash
npm run build
```

## Tech Stack

- React 18 + TypeScript
- Framer Motion
- @ios26_design_system/tokens
