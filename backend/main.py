"""
SketchCode AI — Python / FastAPI backend
=========================================
Serves the existing frontend (HTML/CSS/JS) as static files and proxies
all OpenAI API calls so the API key never lives in the browser.

Run:
    uvicorn main:app --reload --port 8000

Then open:  http://localhost:8000
"""

import os
import json
import httpx
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# ── Load .env using absolute path so it works regardless of where uvicorn runs
ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)
SERVER_API_KEY = os.getenv("OPENAI_API_KEY", "")   # set this to skip per-request key
OPENAI_URL     = "https://api.openai.com/v1/chat/completions"

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="SketchCode AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AI proxy endpoint ─────────────────────────────────────────────────────────
# The frontend sends the exact same body it used to send to OpenAI.
# We forward it to OpenAI using the server key (or the key from the request).

@app.post("/api/ai/proxy")
async def ai_proxy(request: Request):
    """
    Transparent proxy to OpenAI chat completions.
    Resolves API key priority:
      1. Server-side OPENAI_API_KEY from .env  (most secure)
      2. Authorization header sent by the browser (user's own key)
    """
    # Resolve which key to use
    api_key = SERVER_API_KEY
    if not api_key:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            api_key = auth_header[7:]
    if not api_key:
        raise HTTPException(status_code=401, detail="No API key configured. "
                            "Set OPENAI_API_KEY in backend/.env or enter your key in AI Settings.")

    # Forward the request body to OpenAI
    body = await request.body()
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(OPENAI_URL, headers=headers, content=body)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"OpenAI unreachable: {e}")

    return JSONResponse(content=resp.json(), status_code=resp.status_code)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "server_key_set": bool(SERVER_API_KEY),
        "message": "SketchCode AI backend is running"
    }


# ── Serve the existing frontend (must be LAST so API routes take priority) ───
FRONTEND_DIR = Path(__file__).parent.parent  # project root

app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
