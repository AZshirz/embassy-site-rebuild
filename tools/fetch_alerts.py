"""
Keep the site's travel-advisory data current from the State Department's public RSS feed.

Usage:
    python tools/fetch_alerts.py            # update site/src/data/alerts.json if the feed has news
    python tools/fetch_alerts.py --dry-run  # report what would change, write nothing

Reads:  https://travel.state.gov/_res/rss/TAsTWs.xml  (every country's current advisory, ~220 items)
Writes: site/src/data/alerts.json  (only when something actually changed)

Azerbaijan's advisory changes a few times a year at most, so most runs find nothing new
and exit without touching the file. The GitHub Actions workflow commits the file only if this
script changed it. Standard library only, so it runs anywhere without installing packages.

Only the stable fields (level, title, link, published date) decide whether something changed.
The one-line summary is refreshed alongside them but never triggers an update by itself, because
the feed's description text varies slightly between fetches.

Exit codes: 0 = ran fine (changed or not), 1 = feed unreachable or unparseable.
"""
from __future__ import annotations

import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

FEED_URL = "https://travel.state.gov/_res/rss/TAsTWs.xml"
COUNTRY_NAME = "Azerbaijan"
COUNTRY_TAGS = {"AJ", "AZ"}   # the feed uses FIPS codes (AJ), not ISO (AZ); accept both
DATA_FILE = Path(__file__).resolve().parent.parent / "site" / "src" / "data" / "alerts.json"
USER_AGENT = "embassy-site-rebuild/1.0 (portfolio project; daily advisory check)"
STABLE_FIELDS = ("level", "title", "link", "published")


def fetch_feed(url: str = FEED_URL) -> ET.Element:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return ET.fromstring(resp.read())


def parse_date(text: str) -> str:
    """Feed dates look like 'Tue, 28 Apr 2026' (no time), which the email parser rejects."""
    text = text.strip()
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


def is_country(item: dict) -> bool:
    return item["country"] in COUNTRY_TAGS or item["title"].startswith(f"{COUNTRY_NAME} -")


def parse_items(root: ET.Element) -> list[dict]:
    """Flatten each <item> into a dict with the fields we care about."""
    items = []
    for item in root.iter("item"):
        cats = {c.get("domain"): (c.text or "").strip() for c in item.findall("category")}
        title = (item.findtext("title") or "").strip()
        m = re.search(r"Level (\d)", cats.get("Threat-Level", "") or title)
        items.append({
            "title": title,
            "link": (item.findtext("link") or "").strip(),
            "country": cats.get("Country-Tag", ""),
            "level": int(m.group(1)) if m else None,
            "published": parse_date(item.findtext("pubDate") or ""),
            "summary": clean_summary(item.findtext("description") or ""),
        })
    return items


def apply_updates(data: dict, items: list[dict]) -> list[str]:
    """Update `data` in place from feed items. Returns a human-readable list of changes."""
    changes: list[str] = []

    country_items = [it for it in items if is_country(it) and it["level"]]
    if country_items:
        it = max(country_items, key=lambda x: x["published"])   # newest wins if there are several
        adv = data["advisory"]
        if tuple(adv.get(k) for k in STABLE_FIELDS) != tuple(it[k] for k in STABLE_FIELDS):
            changes.append(f"advisory: Level {adv.get('level')} -> Level {it['level']} ({it['published']})")
            adv.update({k: it[k] for k in STABLE_FIELDS}, summary=it["summary"])

    for it in items:
        if "worldwide caution" in it["title"].lower():
            wc = data["worldwide_caution"]
            if (wc["link"], wc["published"]) != (it["link"], it["published"]):
                changes.append(f"worldwide caution: updated {it['published']}")
                wc.update(active=True, link=it["link"], published=it["published"])

    if changes:
        data["updated"] = datetime.now(timezone.utc).date().isoformat()
    return changes


def main(argv: list[str]) -> int:
    dry_run = "--dry-run" in argv
    try:
        items = parse_items(fetch_feed())
    except Exception as exc:  # network error, bad XML, HTTP 4xx/5xx
        print(f"ERROR: could not read feed: {exc}", file=sys.stderr)
        return 1

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    print(f"Feed has {len(items)} items; looking for {COUNTRY_NAME} and Worldwide Caution.")
    changes = apply_updates(data, items)

    if not changes:
        print("No change.")
        return 0
    for c in changes:
        print("Change:", c)
    if dry_run:
        print("Dry run: file not written.")
    else:
        DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Wrote {DATA_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
