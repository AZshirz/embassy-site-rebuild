"""
API tests. No network: the travel.state.gov feed and the site's search index are replaced with
small fixtures, so these run in CI in a second and fail only when our own code is wrong.

Run:  cd api && python -m pytest -q
"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import advisories  # noqa: E402
import ask  # noqa: E402
import main  # noqa: E402

FEED_XML = b"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>
<item>
  <title>Azerbaijan - Level 3: Reconsider Travel</title>
  <link>https://travel.state.gov/x/destination.aze.html</link>
  <pubDate>Tue, 28 Apr 2026</pubDate>
  <description>Reconsider travel&lt;p&gt;\xef\xbf\xbdto &lt;b&gt;Azerbaijan &lt;/b&gt;due to &lt;b&gt;terrorism&lt;/b&gt; , and &lt;b&gt;landmines&lt;/b&gt;. More text.&lt;/p&gt;</description>
  <category domain="Threat-Level">Level 3: Reconsider Travel</category>
  <category domain="Country-Tag">AJ</category>
</item>
<item>
  <title>Cambodia - Level 2: Exercise Increased Caution</title>
  <link>https://travel.state.gov/x/destination.khm.html</link>
  <pubDate>Tue, 15 Sep 2026</pubDate>
  <description>Exercise increased caution in Cambodia due to crime.</description>
  <category domain="Threat-Level">Level 2: Exercise Increased Caution</category>
  <category domain="Country-Tag">KH</category>
</item>
<item>
  <title>Worldwide Caution</title>
  <link>https://travel.state.gov/x/worldwide-caution.html</link>
  <pubDate>Mon, 01 Jun 2026</pubDate>
  <description>Increased caution worldwide.</description>
</item>
</channel></rss>"""

INDEX = [
    {"lang": "en", "url": "/visas/", "title": "U.S. Visas", "section": "What is a visa?", "text": "A citizen of a foreign country who seeks to enter the United States generally must first obtain a U.S. visa."},
    {"lang": "en", "url": "/citizen-services/", "title": "American Citizens Services", "section": "Passports", "text": "U.S. citizens overseas can renew, replace, or apply for a new passport."},
    {"lang": "az", "url": "/az/visas/", "title": "ABŞ vizaları", "section": "Viza nədir?", "text": "Xarici ölkə vətəndaşı ABŞ vizası almalıdır."},
]


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Serve the fixtures instead of hitting the internet, and reset caches between tests."""
    async def fake_feed():
        return advisories.parse_items(FEED_XML)

    async def fake_index():
        return INDEX

    monkeypatch.setattr(main, "load_feed", fake_feed)
    monkeypatch.setattr(main, "load_index", fake_index)
    main._feedback_hits.clear()
    main._ask_hits.clear()


client = TestClient(main.app)


# ---------- parser ----------

def test_parse_items_reads_level_code_date_and_summary():
    items = advisories.parse_items(FEED_XML)
    az = advisories.find_country(items, "Azerbaijan")
    assert az["level"] == 3 and az["country"] == "AJ" and az["published"] == "2026-04-28"
    assert az["summary"] == "Reconsider travel to Azerbaijan due to terrorism, and landmines."
    assert advisories.find_country(items, "AZ") is az            # ISO alias
    assert advisories.find_country(items, "Narnia") is None


# ---------- alerts ----------

def test_alerts_default_country():
    r = client.get("/alerts")
    assert r.status_code == 200
    body = r.json()
    assert body["country_name"] == "Azerbaijan" and body["level"] == 3 and body["level_name"] == "Reconsider Travel"


def test_alerts_unknown_country_is_404():
    assert client.get("/alerts", params={"country": "Narnia"}).status_code == 404


def test_alerts_all_and_level_filter():
    assert client.get("/alerts/all").json()["count"] == 2
    r = client.get("/alerts/all", params={"level": 2}).json()
    assert r["count"] == 1 and r["items"][0]["country_name"] == "Cambodia"
    assert client.get("/alerts/all", params={"level": 9}).status_code == 422


def test_alerts_falls_back_to_bundled_file_when_feed_is_down(monkeypatch):
    async def boom():
        raise RuntimeError("feed down")
    monkeypatch.setattr(main, "load_feed", boom)
    r = client.get("/alerts")
    assert r.status_code == 200 and r.json()["source"] == "bundled alerts.json"
    assert client.get("/alerts", params={"country": "Cambodia"}).status_code == 503


# ---------- search ----------

def test_search_ranks_title_hits_first_and_filters_by_language():
    r = client.get("/search", params={"q": "visa"}).json()
    assert r["count"] == 1 and r["results"][0]["url"] == "/visas/"
    assert "visa" in r["results"][0]["snippet"].lower()
    az = client.get("/search", params={"q": "viza", "lang": "az"}).json()
    assert az["count"] == 1 and az["results"][0]["url"] == "/az/visas/"


def test_search_rejects_short_or_empty_queries():
    assert client.get("/search", params={"q": "a"}).status_code == 422
    assert client.get("/search", params={"q": "!!"}).status_code == 422


# ---------- feedback ----------

def test_feedback_accepts_a_valid_submission():
    r = client.post("/feedback", json={"page": "/visas/", "rating": 4, "message": "  Clear   and useful. "})
    assert r.status_code == 201 and r.json()["received"] is True and len(r.json()["id"]) == 12


def test_feedback_validation():
    assert client.post("/feedback", json={"page": "/visas/", "rating": 6}).status_code == 422          # rating range
    assert client.post("/feedback", json={"page": "http://evil", "rating": 3}).status_code == 422      # not a site path
    assert client.post("/feedback", json={"page": "/", "rating": 3, "email": "nope"}).status_code == 422
    assert client.post("/feedback", json={"page": "/", "rating": 3, "website": "spam"}).status_code == 422  # honeypot


def test_feedback_rate_limit():
    for _ in range(main.FEEDBACK_LIMIT_PER_HOUR):
        assert client.post("/feedback", json={"page": "/", "rating": 5}).status_code == 201
    assert client.post("/feedback", json={"page": "/", "rating": 5}).status_code == 429


# ---------- headers ----------

def test_security_headers_present():
    h = client.get("/health").headers
    assert h["x-content-type-options"] == "nosniff" and h["x-frame-options"] == "DENY"


# ---------- ask the embassy (grounded QA) ----------

def fake_model(reply: str):
    """A stand-in for Ollama that returns a fixed reply and records what it was asked."""
    calls = []

    async def chat(base_url, model, messages, timeout=60.0):
        calls.append(messages)
        return reply
    chat.calls = calls
    return chat


def test_ask_declines_without_calling_the_model_when_nothing_matches(monkeypatch):
    chat = fake_model("should never be used")
    monkeypatch.setattr(ask, "ollama_chat", chat)
    monkeypatch.setattr(main, "OLLAMA_URL", "http://127.0.0.1:11434")
    r = client.post("/ask", json={"question": "What is the weather on Mars?"})
    assert r.status_code == 200
    body = r.json()
    assert body["grounded"] is False and body["sources"] == [] and body["model"] is None
    assert chat.calls == []                      # layer 1: no retrieval hit -> model not called


def test_ask_returns_a_cited_answer_with_only_the_cited_sources(monkeypatch):
    monkeypatch.setattr(ask, "ollama_chat", fake_model("You generally need a visa placed in your passport [1]."))
    monkeypatch.setattr(main, "OLLAMA_URL", "http://127.0.0.1:11434")
    body = client.post("/ask", json={"question": "Do I need a visa to enter the United States?"}).json()
    assert body["grounded"] is True and "[1]" in body["answer"]
    assert [s["url"] for s in body["sources"]] == ["/visas/"]


def test_ask_replaces_an_uncited_answer_with_the_decline_text(monkeypatch):
    monkeypatch.setattr(ask, "ollama_chat", fake_model("Visas cost $185 and take two weeks."))   # confident, no citation
    monkeypatch.setattr(main, "OLLAMA_URL", "http://127.0.0.1:11434")
    body = client.post("/ask", json={"question": "How much does a visa cost?"}).json()
    assert body["grounded"] is False and "$185" not in body["answer"]     # layer 3: ungrounded answer never ships
    assert body["sources"]                                                # ...but the closest pages are still offered


def test_ask_honours_the_models_cannot_answer_signal(monkeypatch):
    monkeypatch.setattr(ask, "ollama_chat", fake_model("CANNOT_ANSWER"))
    monkeypatch.setattr(main, "OLLAMA_URL", "http://127.0.0.1:11434")
    body = client.post("/ask", json={"question": "Which visa office has the shortest wait?"}).json()
    assert body["grounded"] is False and body["answer"] == ask.DECLINE["en"]


def test_ask_prompt_contains_only_retrieved_passages_and_the_rules(monkeypatch):
    chat = fake_model("CANNOT_ANSWER")
    monkeypatch.setattr(ask, "ollama_chat", chat)
    monkeypatch.setattr(main, "OLLAMA_URL", "http://127.0.0.1:11434")
    client.post("/ask", json={"question": "passport renewal", "lang": "en"})
    system, user = chat.calls[0][0]["content"], chat.calls[0][1]["content"]
    assert "ONLY the numbered passages" in system and "CANNOT_ANSWER" in system
    assert "[1] American Citizens Services" in user and "ABŞ vizaları" not in user   # English only


def test_ask_is_disabled_without_ollama_url(monkeypatch):
    monkeypatch.setattr(main, "OLLAMA_URL", "")
    assert client.get("/ask/status").json() == {"enabled": False, "model": None}
    assert client.post("/ask", json={"question": "anything at all"}).status_code == 503


def test_ask_validation_and_rate_limit(monkeypatch):
    monkeypatch.setattr(ask, "ollama_chat", fake_model("CANNOT_ANSWER"))
    monkeypatch.setattr(main, "OLLAMA_URL", "http://127.0.0.1:11434")
    assert client.post("/ask", json={"question": "hi"}).status_code == 422          # too short
    assert client.post("/ask", json={"question": "x" * 301}).status_code == 422     # too long
    for _ in range(main.ASK_LIMIT_PER_HOUR):
        assert client.post("/ask", json={"question": "visa question"}).status_code == 200
    assert client.post("/ask", json={"question": "visa question"}).status_code == 429
