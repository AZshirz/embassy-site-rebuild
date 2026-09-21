"""
Parsing for the State Department travel-advisory RSS feed.

Pure functions, standard library only. Shared by the API (live /alerts endpoint) and by
tools/fetch_alerts.py (the daily job that updates the site's alerts.json).
"""
from __future__ import annotations

import html
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime

FEED_URL = "https://travel.state.gov/_res/rss/TAsTWs.xml"
USER_AGENT = "embassy-site-rebuild/1.0 (portfolio project)"

LEVEL_NAMES = {
    1: "Exercise Normal Precautions",
    2: "Exercise Increased Caution",
    3: "Reconsider Travel",
    4: "Do Not Travel",
}


def fetch_feed_xml(url: str = FEED_URL, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def parse_date(text: str) -> str:
    """Feed dates look like 'Tue, 28 Apr 2026' (no time), which the email parser rejects."""
    text = (text or "").strip()
    for attempt in (lambda t: parsedate_to_datetime(t), lambda t: datetime.strptime(t, "%a, %d %b %Y")):
        try:
            return attempt(text).date().isoformat()
        except (TypeError, ValueError):
            continue
    return ""


def clean_summary(description_html: str) -> str:
    """One plain-text sentence: prefer the 'Reconsider travel to X due to ...' sentence if present."""
    text = html.unescape(description_html or "")
    text = re.sub(r"<[^>]+>", " ", text)                 # drop tags
    text = re.sub(r"[\s�]+", " ", text).strip()     # collapse whitespace and stray replacement chars
    text = re.sub(r"\s+([,.;:])", r"\1", text)           # "terrorism , armed" -> "terrorism, armed"
    if not text:
        return ""
    sentences = [s.strip() for s in re.split(r"(?<=\.)\s+", text) if s.strip()]
    chosen = next((s for s in sentences if " due to " in s), sentences[0])
    return chosen[:300]


def parse_items(xml_bytes: bytes) -> list[dict]:
    """Flatten each <item> of the feed into a dict."""
    root = ET.fromstring(xml_bytes)
    items = []
    for item in root.iter("item"):
        cats = {c.get("domain"): (c.text or "").strip() for c in item.findall("category")}
        title = (item.findtext("title") or "").strip()
        m = re.search(r"Level (\d)", cats.get("Threat-Level", "") or title)
        country_name = title.split(" - ")[0].strip() if " - " in title else title
        items.append({
            "title": title,
            "country_name": country_name,
            "country": cats.get("Country-Tag", ""),        # FIPS code, e.g. "AJ" for Azerbaijan
            "level": int(m.group(1)) if m else None,
            "level_name": LEVEL_NAMES.get(int(m.group(1))) if m else None,
            "link": (item.findtext("link") or "").strip(),
            "published": parse_date(item.findtext("pubDate") or ""),
            "summary": clean_summary(item.findtext("description") or ""),
        })
    return items


def find_country(items: list[dict], query: str) -> dict | None:
    """Match by FIPS/ISO-ish code ("AJ", "AZ") or by country name ("Azerbaijan"), newest first."""
    q = (query or "").strip().lower()
    aliases = {"az": "aj"}  # accept the ISO code people expect
    q = aliases.get(q, q)
    matches = [it for it in items if it["level"] and (it["country"].lower() == q or it["country_name"].lower() == q)]
    if not matches:
        return None
    return max(matches, key=lambda it: it["published"])
