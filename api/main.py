"""
Embassy Site Rebuild — backend API (FastAPI).

Three small, real endpoints behind the static site:

  GET  /alerts            current travel advisory for one country, read live from travel.state.gov
                          (cached for an hour) with the site's bundled alerts.json as a fallback
  GET  /alerts/all        every country's current advisory level (filter with ?level=4)
  GET  /search?q=visa     full-text search over the site's own pages (index built by the site at build time)
  POST /feedback          "Help us improve" form: validated, rate-limited, logged

Run locally:   uvicorn main:app --reload --port 8000      (from the api/ folder)
Docs:          http://localhost:8000/docs
Deploy:        Dockerfile in this folder -> Google Cloud Run (see README)
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
import uuid
from collections import defaultdict, deque
from pathlib import Path
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator

import advisories
import ask as ask_module

# ---------- configuration (environment variables, with sensible defaults) ----------

SITE_URL = os.environ.get("SITE_URL", "https://embassy-site-rebuild.ashirz.workers.dev").rstrip("/")
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", f"{SITE_URL},http://localhost:4321").split(",") if o.strip()]
FEED_CACHE_SECONDS = int(os.environ.get("FEED_CACHE_SECONDS", "3600"))
SEARCH_CACHE_SECONDS = int(os.environ.get("SEARCH_CACHE_SECONDS", "900"))
FEEDBACK_LIMIT_PER_HOUR = int(os.environ.get("FEEDBACK_LIMIT_PER_HOUR", "5"))
# Fallback copy of the site's alerts.json (tools/fetch_alerts.py keeps both files in sync).
BUNDLED_ALERTS = Path(__file__).resolve().parent / "data" / "alerts.json"

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("api")

app = FastAPI(
    title="Embassy Site Rebuild API",
    version="0.2.0",
    description="Backend for the U.S. Embassy in Azerbaijan site rebuild (portfolio project, unofficial).",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    max_age=600,
)

STARTED = time.time()


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Same defence-in-depth headers the static site sends."""
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Cache-Control", "no-store")
    return response


# ---------- a tiny time-based cache so upstream sites are not hit on every request ----------

class Cached:
    def __init__(self, ttl: int):
        self.ttl, self.value, self.at = ttl, None, 0.0

    def fresh(self) -> bool:
        return self.value is not None and (time.time() - self.at) < self.ttl

    def set(self, value):
        self.value, self.at = value, time.time()
        return value


feed_cache = Cached(FEED_CACHE_SECONDS)
index_cache = Cached(SEARCH_CACHE_SECONDS)


# ---------- health ----------

@app.get("/", tags=["meta"])
def root():
    return {"service": app.title, "version": app.version, "docs": "/docs",
            "endpoints": ["/health", "/alerts", "/alerts/all", "/search?q=", "POST /feedback"]}


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "uptime_seconds": round(time.time() - STARTED), "feed_cached": feed_cache.fresh(),
            "search_index_cached": index_cache.fresh()}


# ---------- alerts ----------

async def load_feed() -> list[dict]:
    if feed_cache.fresh():
        return feed_cache.value
    async with httpx.AsyncClient(timeout=20, headers={"User-Agent": advisories.USER_AGENT}) as client:
        resp = await client.get(advisories.FEED_URL)
        resp.raise_for_status()
    return feed_cache.set(advisories.parse_items(resp.content))


def bundled_alert() -> dict:
    data = json.loads(BUNDLED_ALERTS.read_text(encoding="utf-8"))
    adv = data["advisory"]
    return {**adv, "country_name": "Azerbaijan", "level_name": advisories.LEVEL_NAMES.get(adv["level"]),
            "source": "bundled alerts.json", "as_of": data["updated"]}


@app.get("/alerts", tags=["alerts"])
async def get_alert(country: str = Query("Azerbaijan", description="Country name or code (AZ / AJ)")):
    """Current travel advisory for one country. Live from travel.state.gov; falls back to the bundled file."""
    try:
        items = await load_feed()
    except Exception as exc:  # feed down or unreachable: degrade gracefully for the default country
        log.warning(json.dumps({"event": "feed_error", "error": str(exc)}))
        if country.lower() in ("azerbaijan", "az", "aj"):
            return bundled_alert()
        raise HTTPException(status_code=503, detail="Travel advisory feed is unavailable; try again later.")
    found = advisories.find_country(items, country)
    if not found:
        raise HTTPException(status_code=404, detail=f"No advisory found for '{country}'.")
    return {**found, "source": advisories.FEED_URL}


@app.get("/alerts/all", tags=["alerts"])
async def get_all_alerts(level: int | None = Query(None, ge=1, le=4, description="Only this advisory level")):
    """Every country's current advisory level, optionally filtered by level."""
    items = await load_feed()
    rows = [{k: it[k] for k in ("country_name", "country", "level", "level_name", "published", "link")}
            for it in items if it["level"] and (level is None or it["level"] == level)]
    rows.sort(key=lambda r: (-r["level"], r["country_name"]))
    return {"count": len(rows), "source": advisories.FEED_URL, "items": rows}


# ---------- search ----------

async def load_index() -> list[dict]:
    """The static site publishes /search-index.json at build time; this fetches and caches it."""
    if index_cache.fresh():
        return index_cache.value
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(f"{SITE_URL}/search-index.json")
        resp.raise_for_status()
    return index_cache.set(resp.json())


def tokenize(text: str) -> list[str]:
    """Lower-case words with a crude plural fold so 'passport' matches 'passports' (and vice versa)."""
    return [w[:-1] if len(w) > 3 and w.endswith("s") else w for w in re.findall(r"\w+", text.lower())]


def score(entry: dict, terms: list[str]) -> int:
    """Simple, explainable ranking: title hits count 5, section-heading hits 3, body hits 1."""
    title, section, body = tokenize(entry["title"]), tokenize(entry.get("section", "")), tokenize(entry["text"])
    s = 0
    for t in terms:
        s += 5 * title.count(t) + 3 * section.count(t) + body.count(t)
    return s


def snippet(text: str, terms: list[str], width: int = 160) -> str:
    low = text.lower()
    pos = min((low.find(t) for t in terms if low.find(t) >= 0), default=0)
    start = max(0, pos - width // 3)
    piece = text[start:start + width].strip()
    return ("…" if start > 0 else "") + piece + ("…" if start + width < len(text) else "")


@app.get("/search", tags=["search"])
async def search(q: str = Query(..., min_length=2, max_length=100), lang: Literal["en", "az"] = "en", limit: int = Query(10, ge=1, le=25)):
    """Search the site's own pages. Returns the best-matching sections with a snippet."""
    terms = tokenize(q)
    if not terms:
        raise HTTPException(status_code=422, detail="Query has no searchable words.")
    try:
        index = await load_index()
    except Exception as exc:
        log.warning(json.dumps({"event": "index_error", "error": str(exc)}))
        raise HTTPException(status_code=503, detail="Search index is unavailable; try again later.")
    scored = [(score(e, terms), e) for e in index if e["lang"] == lang]
    hits = sorted((se for se in scored if se[0] > 0), key=lambda se: -se[0])[:limit]
    return {"query": q, "lang": lang, "count": len(hits),
            "results": [{"title": e["title"], "section": e.get("section"), "url": e["url"], "score": s,
                         "snippet": snippet(e["text"], terms)} for s, e in hits]}


# ---------- feedback ----------

class Feedback(BaseModel):
    page: str = Field(..., max_length=200, description="Path of the page the feedback is about, e.g. /visas/")
    rating: int = Field(..., ge=1, le=5)
    message: str = Field("", max_length=1000)
    email: EmailStr | None = None
    website: str = Field("", max_length=0, description="Honeypot: must stay empty (bots fill it in)")

    @field_validator("page")
    @classmethod
    def page_must_be_a_site_path(cls, v: str) -> str:
        if not re.fullmatch(r"/[A-Za-z0-9\-_/]*", v):
            raise ValueError("page must be a path on this site, like /visas/")
        return v

    @field_validator("message")
    @classmethod
    def strip_message(cls, v: str) -> str:
        return re.sub(r"\s+", " ", v).strip()


_feedback_hits: dict[str, deque] = defaultdict(deque)
_ask_hits: dict[str, deque] = defaultdict(deque)


def client_ip_of(request: Request) -> str:
    return request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0].strip()


def rate_limited(client_ip: str, hits_by_ip: dict[str, deque] = _feedback_hits, limit: int = FEEDBACK_LIMIT_PER_HOUR) -> bool:
    """Sliding one-hour window per IP, in memory (fine for one small instance)."""
    now = time.time()
    hits = hits_by_ip[client_ip]
    while hits and now - hits[0] > 3600:
        hits.popleft()
    if len(hits) >= limit:
        return True
    hits.append(now)
    return False


@app.post("/feedback", status_code=201, tags=["feedback"])
def post_feedback(item: Feedback, request: Request):
    """Accept a 'Help us improve' submission. Stored as a structured log line (no database needed)."""
    client_ip = client_ip_of(request)
    if rate_limited(client_ip):
        raise HTTPException(status_code=429, detail="Too many submissions; please try again later.")
    feedback_id = uuid.uuid4().hex[:12]
    log.info(json.dumps({"event": "feedback", "id": feedback_id, "page": item.page, "rating": item.rating,
                         "message": item.message, "has_email": item.email is not None}))
    return {"id": feedback_id, "received": True}


# ---------- ask the embassy (local demo; off unless OLLAMA_URL is set) ----------

OLLAMA_URL = os.environ.get("OLLAMA_URL", "").rstrip("/")          # e.g. http://127.0.0.1:11434 - never a public host
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")
ASK_LIMIT_PER_HOUR = int(os.environ.get("ASK_LIMIT_PER_HOUR", "20"))


class Question(BaseModel):
    question: str = Field(..., min_length=3, max_length=300)
    lang: Literal["en", "az"] = "en"

    @field_validator("question")
    @classmethod
    def collapse_whitespace(cls, v: str) -> str:
        return re.sub(r"\s+", " ", v).strip()


@app.get("/ask/status", tags=["ask"])
def ask_status():
    """Lets the page find out whether the assistant is available on this deployment."""
    return {"enabled": bool(OLLAMA_URL), "model": OLLAMA_MODEL if OLLAMA_URL else None}


@app.post("/ask", tags=["ask"])
async def post_ask(item: Question, request: Request):
    """Answer a question using only the site's own pages, with citations; decline otherwise."""
    if not OLLAMA_URL:
        raise HTTPException(status_code=503, detail="The assistant is not enabled on this deployment.")
    if rate_limited(client_ip_of(request), _ask_hits, ASK_LIMIT_PER_HOUR):
        raise HTTPException(status_code=429, detail="Too many questions; please try again later.")
    try:
        index = await load_index()
    except Exception as exc:
        log.warning(json.dumps({"event": "index_error", "error": str(exc)}))
        raise HTTPException(status_code=503, detail="The site index is unavailable; try again later.")
    try:
        result = await ask_module.ask(index, item.question, item.lang, OLLAMA_URL, OLLAMA_MODEL)
    except httpx.HTTPError as exc:
        log.warning(json.dumps({"event": "ollama_error", "error": str(exc)}))
        raise HTTPException(status_code=503, detail="The assistant is temporarily unavailable.")
    log.info(json.dumps({"event": "ask", "lang": item.lang, "grounded": result["grounded"],
                         "sources": len(result["sources"]), "question_chars": len(item.question)}))
    return result
