"""
"Ask the embassy": grounded question answering over the site's own pages.

The rule: the model may only answer from passages retrieved from the site's search index, must
cite them, and must decline anything the passages don't cover. Three layers enforce that:

  1. Retrieval gate   - if no passage matches the question at all, decline WITHOUT calling the
                        model (deterministic, free, and immune to hallucination).
  2. Prompt           - the model is told it is answering for a government website, given only
                        the retrieved passages, and instructed to say it cannot answer otherwise.
  3. Citation check   - the answer must reference at least one of the passages it was given
                        (by [n] marker). If it doesn't, the answer is replaced with the decline
                        text plus links to the closest pages, so an ungrounded answer never ships.

The model runs locally through Ollama (http://127.0.0.1:11434). Nothing here has tools, file
access or the ability to act: it is text in, text out. Pure functions where possible so the
tests can exercise every path with a fake model.
"""
from __future__ import annotations

import re

import httpx

DECLINE = {
    "en": "I can't answer that from the information on this site. The pages below are the closest "
          "matches; for anything else, please contact the embassy directly.",
    "az": "Bu suala saytdakı məlumat əsasında cavab verə bilmirəm. Aşağıdakı səhifələr ən yaxın "
          "uyğunluqdur; digər suallar üçün birbaşa səfirliklə əlaqə saxlayın.",
}

SYSTEM_PROMPT = """You answer questions for the website of the U.S. Embassy in Azerbaijan.

Rules you must follow:
1. Use ONLY the numbered passages provided. Do not use any other knowledge.
2. Every sentence that states a fact must end with the passage number it came from, like [2].
3. If the passages do not contain the answer, reply with exactly: CANNOT_ANSWER
4. Never invent phone numbers, fees, dates, addresses, or requirements.
5. Be brief: two to four sentences. Reply in {language}."""

LANGUAGE_NAMES = {"en": "English", "az": "Azerbaijani"}


# ---------- retrieval (same scoring the /search endpoint uses) ----------

def tokenize(text: str) -> list[str]:
    return [w[:-1] if len(w) > 3 and w.endswith("s") else w for w in re.findall(r"\w+", text.lower())]


def score(entry: dict, terms: list[str]) -> int:
    """Rank for question answering: reward matching MANY DIFFERENT words from the question, and cap how
    much one repeated word can contribute, so a page that says "visa" twenty times can't outrank the
    page that actually has the phone number the question asked about."""
    title, section, body = tokenize(entry["title"]), tokenize(entry.get("section", "")), tokenize(entry["text"])
    total, distinct = 0, 0
    for t in set(terms):
        hits = 5 * title.count(t) + 3 * section.count(t) + min(body.count(t), 3)
        if hits:
            distinct += 1
            total += hits
    return total + 8 * distinct


# Words that appear in almost every passage and carry no meaning for retrieval. Without this
# filter "What is the weather on Mars?" matches every page (on "what", "is", "the", "on") and
# the retrieval gate can never say "nothing on the site covers this".
STOPWORDS = {
    "en": {"a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "for", "by", "with", "from", "is", "are",
           "was", "be", "do", "doe", "did", "can", "could", "should", "would", "will", "i", "you", "we", "they", "it",
           "my", "your", "our", "me", "what", "which", "who", "how", "when", "where", "why", "there", "thi", "that",
           "these", "those", "have", "ha", "had", "need", "get", "want", "about", "any", "some", "if", "not", "no"},
    "az": {"və", "ilə", "üçün", "bu", "o", "bir", "nə", "necə", "harada", "hansı", "mən", "siz", "biz", "var",
           "yox", "də", "da", "ki", "olan", "üzrə", "haqqında", "lazımdır", "edə", "bilərəm"},
}


def question_terms(question: str, lang: str) -> list[str]:
    stop = STOPWORDS.get(lang, set()) | STOPWORDS["en"]
    return [t for t in tokenize(question) if t not in stop and len(t) > 1]


def retrieve(index: list[dict], question: str, lang: str, k: int = 6) -> list[dict]:
    """Top-k passages for the question, best first. Empty list means 'the site has nothing on this'."""
    terms = question_terms(question, lang)
    if not terms:
        return []
    scored = [(score(e, terms), e) for e in index if e["lang"] == lang]
    return [e for s, e in sorted(scored, key=lambda se: -se[0]) if s > 0][:k]


# ---------- prompt ----------

def build_messages(question: str, passages: list[dict], lang: str) -> list[dict]:
    numbered = "\n\n".join(f"[{i}] {p['title']} — {p.get('section') or ''}\n{p['text']}" for i, p in enumerate(passages, 1))
    return [
        {"role": "system", "content": SYSTEM_PROMPT.format(language=LANGUAGE_NAMES.get(lang, "English"))},
        {"role": "user", "content": f"Passages:\n\n{numbered}\n\nQuestion: {question}"},
    ]


# ---------- model ----------

async def ollama_chat(base_url: str, model: str, messages: list[dict], timeout: float = 60.0) -> str:
    """One non-streaming chat completion from a local Ollama server."""
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(f"{base_url}/api/chat", json={
            "model": model, "messages": messages, "stream": False,
            "options": {"temperature": 0.1, "num_predict": 300},   # low temperature: stick to the passages
        })
        resp.raise_for_status()
    return (resp.json().get("message") or {}).get("content", "").strip()


# ---------- grounding checks ----------

def cited_indexes(answer: str, n_passages: int) -> list[int]:
    """Passage numbers the answer cites, e.g. '[2]' -> 2, restricted to the ones that were provided."""
    return sorted({int(m) for m in re.findall(r"\[(\d+)\]", answer) if 1 <= int(m) <= n_passages})


def finalize(answer: str, passages: list[dict], lang: str) -> dict:
    """Apply the grounding rules to a raw model answer and shape the response."""
    sources = [{"n": i, "title": p["title"], "section": p.get("section"), "url": p["url"]} for i, p in enumerate(passages, 1)]
    declined = not answer or "CANNOT_ANSWER" in answer
    cites = [] if declined else cited_indexes(answer, len(passages))
    if declined or not cites:
        # "Closest pages" list: one link per URL, even if several passages from it matched.
        seen: set[str] = set()
        closest = [s for s in sources if not (s["url"] in seen or seen.add(s["url"]))]
        return {"answer": DECLINE.get(lang, DECLINE["en"]), "grounded": False, "sources": closest}
    return {"answer": answer, "grounded": True, "sources": [s for s in sources if s["n"] in cites]}


async def ask(index: list[dict], question: str, lang: str, base_url: str, model: str) -> dict:
    passages = retrieve(index, question, lang)
    if not passages:
        # Layer 1: nothing on the site matches, so don't even ask the model.
        return {"answer": DECLINE.get(lang, DECLINE["en"]), "grounded": False, "sources": [], "model": None}
    raw = await ollama_chat(base_url, model, build_messages(question, passages, lang))
    return {**finalize(raw, passages, lang), "model": model}
