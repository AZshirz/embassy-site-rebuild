"""
Keep the site's travel-advisory data current from the State Department's public RSS feed.

Usage:
    python tools/fetch_alerts.py            # update site/src/data/alerts.json if the feed has news
    python tools/fetch_alerts.py --dry-run  # report what would change, write nothing

Reads:  https://travel.state.gov/_res/rss/TAsTWs.xml  (every country's current advisory, ~220 items)
Writes: site/src/data/alerts.json and api/data/alerts.json  (only when something actually changed)

Azerbaijan's advisory changes a few times a year at most, so most runs find nothing new
and exit without touching the file. The GitHub Actions workflow commits the file only if this
script changed it. Standard library only, so it runs anywhere without installing packages.

Only the level and the published date decide whether something changed. Title, link and summary
are refreshed alongside them but never trigger an update by themselves, because the feed serves
slightly different text and URLs from different cache servers.

Feed parsing lives in api/advisories.py and is shared with the API's live /alerts endpoint.

Exit codes: 0 = ran fine (changed or not), 1 = feed unreachable or unparseable.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "api"))
import advisories  # noqa: E402  (shared parser)

COUNTRY = "Azerbaijan"
DATA_FILE = ROOT / "site" / "src" / "data" / "alerts.json"
API_COPY = ROOT / "api" / "data" / "alerts.json"   # the API ships a fallback copy; keep it identical
CHANGE_FIELDS = ("level", "published")                     # what decides "something changed"
COPY_FIELDS = ("level", "title", "link", "published", "summary")   # what gets refreshed when it did


def apply_updates(data: dict, items: list[dict]) -> list[str]:
    """Update `data` in place from feed items. Returns a human-readable list of changes."""
    changes: list[str] = []

    it = advisories.find_country(items, COUNTRY)
    if it:
        adv = data["advisory"]
        if tuple(adv.get(k) for k in CHANGE_FIELDS) != tuple(it[k] for k in CHANGE_FIELDS):
            changes.append(f"advisory: Level {adv.get('level')} -> Level {it['level']} ({it['published']})")
            adv.update({k: it[k] for k in COPY_FIELDS})

    for it in items:
        if "worldwide caution" in it["title"].lower():
            wc = data["worldwide_caution"]
            if wc["published"] != it["published"]:
                changes.append(f"worldwide caution: updated {it['published']}")
                wc.update(active=True, link=it["link"], published=it["published"])

    if changes:
        data["updated"] = datetime.now(timezone.utc).date().isoformat()
    return changes


def main(argv: list[str]) -> int:
    dry_run = "--dry-run" in argv
    try:
        items = advisories.parse_items(advisories.fetch_feed_xml())
    except Exception as exc:  # network error, bad XML, HTTP 4xx/5xx
        print(f"ERROR: could not read feed: {exc}", file=sys.stderr)
        return 1

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    print(f"Feed has {len(items)} items; looking for {COUNTRY} and Worldwide Caution.")
    changes = apply_updates(data, items)

    if not changes:
        print("No change.")
        return 0
    for c in changes:
        print("Change:", c)
    if dry_run:
        print("Dry run: file not written.")
    else:
        text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        for path in (DATA_FILE, API_COPY):
            path.write_text(text, encoding="utf-8")
            print(f"Wrote {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
