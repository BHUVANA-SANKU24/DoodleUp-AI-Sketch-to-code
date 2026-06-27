# AI Design to Code

A full-stack AIML project — a Canva + Procreate inspired visual design canvas that uses GPT-4o to enhance designs and generate production-ready HTML, CSS, and React code simultaneously.

![Builder Preview](https://img.shields.io/badge/Status-Active-brightgreen) ![Python](https://img.shields.io/badge/Python-3.13-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688) ![License](https://img.shields.io/badge/License-MIT-purple)

---

## What it does

- **Design** — drag, drop, draw and arrange elements on a multi-page canvas like Canva
- **Enhance** — describe changes in plain English; GPT-4o redesigns the canvas instantly
- **Generate** — one click produces clean HTML/CSS and React JSX from your design
- **Present** — slideshow/preview mode with animated transitions (fade, slide, zoom, flip, rise)
- **Animate** — per-element entrance animations (bounce, drift, rotate, blur, pop, etc.)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python + FastAPI |
| Server | Uvicorn (ASGI) |
| AI / LLM | OpenAI GPT-4o via Python proxy |
| API Security | Server-side key in `.env` — never exposed to browser |
| Canvas Engine | Fabric.js 5.3.0 |
| Frontend | Vanilla HTML5 + CSS3 + JavaScript (ES2020) |
| Voice Input | Web Speech API |
| File Handling | FileReader API |
| Storage | localStorage |
| Environment | python-dotenv |
| HTTP Client | httpx (async) |

---

## Architecture

```
Browser  (HTML / CSS / JS + Fabric.js)
    │
    │  POST /api/ai/proxy
    ▼
Python FastAPI  (localhost:8000)        ← API key lives here only
    │
    │  POST https://api.openai.com/v1/chat/completions
    ▼
OpenAI GPT-4o
    │
    └──► JSON response → FastAPI → Browser → canvas updated
```

---

## Features

### Canvas Builder
- Multi-page canvas with stacked page view
- Templates library (79+ templates — SaaS, Portfolio, Blog, Presentation, Social)
- Elements: text, shapes, images, buttons, cards, icons, containers
- Draw mode (freehand)
- Undo / redo (unlimited history)
- Snap to grid, alignment guides
- Layers panel, sections panel
- Brand kit (colors, fonts, logos)
- Element animations with duration and delay controls
- Copy, paste, duplicate, rotate, delete for elements and pages
- Right-click context menu on canvas and pages

### AI Features (powered by GPT-4o)
- **Enhance Design** — describe changes in natural language
- **Analyze Layout** — get AI feedback on your design
- **Improve Colors** — AI suggests a better color palette
- **Improve Typography** — font pairing and sizing suggestions
- **Generate sections** — Hero, Testimonial, Features Grid
- **AI Design Chat** — conversational canvas editor with image + voice input
- **Code Generation** — HTML/CSS + React JSX from any design

### Presentation / Preview Mode
- Fullscreen slideshow of all pages
- 5 page transitions: Fade, Slide, Zoom, Rise, Flip
- Per-element entrance animations play after each slide enters
- Auto-play with configurable timing (3s, 5s, 8s, 12s)
- Keyboard navigation (← → Space F Esc)
- Progress bar, dot navigation, fullscreen API

### Export
- Download as PNG / JPEG
- Export generated HTML, CSS, React code
- Copy code to clipboard

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/ai-design-to-code.git
cd ai-design-to-code
```

### 2. Set up the Python backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Add your OpenAI API key

```bash
cp .env.example .env
```

Open `backend/.env` and replace the placeholder:

```
OPENAI_API_KEY=sk-your-actual-key-here
```

Get a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 4. Start the server

```bash
uvicorn main:app --reload --port 8000
```

### 5. Open in browser

```
http://localhost:8000
```

That's it — no build tools, no npm install, no webpack.

---

## Project Structure

```
ai-design-to-code/
│
├── backend/
│   ├── main.py              # FastAPI app — serves frontend + proxies AI calls
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Your API key (gitignored)
│   ├── .env.example         # Template for .env
│   └── .gitignore
│
├── css/
│   ├── style.css            # Shared design tokens
│   ├── builder.css          # Canvas builder styles
│   ├── dashboard.css        # Dashboard styles
│   ├── landing.css          # Landing page styles
│   └── tokens.css           # CSS variables (light + dark theme)
│
├── js/
│   ├── builder.js           # All canvas logic, AI calls, animations
│   ├── dashboard.js         # Project management
│   └── theme.js             # Light / dark mode
│
├── index.html               # Landing page
├── dashboard.html           # Projects dashboard
├── builder.html             # Canvas design editor
└── login.html               # Authentication page
```

---

## How the AI Works

1. User types a prompt — *"change the background to dark navy and make the heading larger"*
2. Browser sends the prompt + a screenshot of the current canvas to `/api/ai/proxy`
3. Python backend forwards the request to GPT-4o using the server-side API key
4. GPT-4o returns a modified Fabric.js canvas JSON
5. Frontend applies the JSON to the canvas — design updates instantly
6. User can accept, reject, or generate code from the result

The same pipeline handles code generation — GPT-4o receives the canvas JSON and returns HTML, CSS, and React code simultaneously.

---

## Security

- The OpenAI API key is stored in `backend/.env` and loaded server-side via `python-dotenv`
- The key is **never** sent to or stored in the browser
- `.env` is listed in `.gitignore` — it will never be pushed to GitHub
- All AI requests go through the FastAPI proxy at `/api/ai/proxy`

---

## Running in Production

For deployment, replace uvicorn's dev server with gunicorn:

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Or deploy to **Railway**, **Render**, or **Fly.io** — add `OPENAI_API_KEY` as an environment variable in the platform dashboard.

---

## License

MIT — free to use, modify, and distribute.
