"""
Static accessibility / structure audit: original embassy pages vs. the rebuilt site.

Usage (from the repo root):
    python tools/audit.py

Reads:
    Source/*.html          saved copies of the original pages ("Webpage, Complete")
    site/dist/**/index.html  the rebuilt pages (run `npm run build` in site/ first)

Writes:
    audit/report.json      raw numbers, one record per page
    audit/report.md        before/after comparison table for the README

Everything here is measured from the HTML alone, so it is deterministic and runs in CI.
Runtime metrics (Lighthouse scores, real transfer size) are collected separately.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, asdict
from pathlib import Path
from urllib.parse import urlparse

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "Source"
DIST_DIR = ROOT / "site" / "dist"
OUT_DIR = ROOT / "audit"

# Which original page corresponds to which rebuilt page.
PAGE_MAP = [
    ("Home", "Homepage", "index.html"),
    ("Visas", "Visas", "visas/index.html"),
    ("Citizen Services", "Services for U.S. and Local Citizens", "citizen-services/index.html"),
    ("Education & Exchanges", "Cultural, educational, or professional exchanges", "education/index.html"),
]

ASSET_EXT = {".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".woff", ".woff2", ".ttf", ".ico"}


@dataclass
class PageAudit:
    page: str
    version: str                # "original" | "rebuild"
    html_bytes: int
    asset_bytes: int            # local assets downloaded with / referenced by the page
    asset_files: int
    h1_count: int
    empty_headings: int
    heading_level_skips: int    # e.g. an h3 directly after an h1
    images: int
    images_missing_alt: int     # no alt attribute at all (always a defect)
    images_empty_alt: int       # alt="" (fine only if decorative)
    links: int
    duplicate_text_blocks: int  # visible text blocks (>= 40 chars) that appear more than once
    duplicate_text_occurrences: int
    tel_links: int
    inline_scripts: int
    third_party_script_hosts: list[str]
    has_lang: bool
    has_skip_link: bool
    has_main: bool
    hreflang_alternates: int


def dir_size(path: Path) -> tuple[int, int]:
    files = [p for p in path.rglob("*") if p.is_file()]
    return sum(p.stat().st_size for p in files), len(files)


def referenced_asset_size(html_path: Path, soup: BeautifulSoup, site_root: Path) -> tuple[int, int]:
    """Sum the sizes of local files the page references directly (CSS, JS, images)."""
    refs: set[str] = set()
    for tag, attr in (("link", "href"), ("script", "src"), ("img", "src")):
        for el in soup.find_all(tag):
            v = el.get(attr)
            if v and not urlparse(v).netloc and Path(v).suffix.lower() in ASSET_EXT:
                refs.add(v)
    total, count = 0, 0
    for ref in refs:
        p = site_root / ref.lstrip("/") if ref.startswith("/") else html_path.parent / ref
        if p.is_file():
            total += p.stat().st_size
            count += 1
    return total, count


def audit_html(page: str, version: str, html_path: Path, asset_bytes: int, asset_files: int) -> PageAudit:
    html = html_path.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(html, "lxml")

    scripts = soup.find_all("script")
    inline_scripts = sum(1 for s in scripts if not s.get("src") and (s.get("type") in (None, "text/javascript", "module")))
    third_party = sorted({urlparse(s["src"]).netloc for s in scripts if s.get("src") and urlparse(s["src"]).netloc})

    for t in soup(["script", "style", "noscript", "template"]):
        t.decompose()

    headings = soup.find_all(re.compile(r"^h[1-6]$"))
    levels = [int(h.name[1]) for h in headings]
    skips = sum(1 for a, b in zip(levels, levels[1:]) if b > a + 1)

    imgs = soup.find_all("img")

    # Duplicate visible text: the original renders desktop + mobile copies of many blocks.
    texts = [t.strip() for t in soup.body.stripped_strings] if soup.body else []
    counts = Counter(t for t in texts if len(t) >= 40)
    dup_blocks = {t: n for t, n in counts.items() if n > 1}

    return PageAudit(
        page=page,
        version=version,
        html_bytes=len(html.encode("utf-8")),
        asset_bytes=asset_bytes,
        asset_files=asset_files,
        h1_count=len(soup.find_all("h1")),
        empty_headings=sum(1 for h in headings if not h.get_text(strip=True)),
        heading_level_skips=skips,
        images=len(imgs),
        images_missing_alt=sum(1 for i in imgs if i.get("alt") is None),
        images_empty_alt=sum(1 for i in imgs if i.get("alt") == ""),
        links=len(soup.find_all("a")),
        duplicate_text_blocks=len(dup_blocks),
        duplicate_text_occurrences=sum(dup_blocks.values()),
        tel_links=len(soup.find_all("a", href=re.compile(r"^tel:"))),
        inline_scripts=inline_scripts,
        third_party_script_hosts=third_party,
        has_lang=bool(soup.html and soup.html.get("lang")),
        has_skip_link=bool(soup.find("a", href=re.compile(r"#(main|content)"))),
        has_main=bool(soup.find("main")),
        hreflang_alternates=len(soup.find_all("link", rel="alternate", hreflang=True)),
    )


def find_source(prefix: str) -> Path:
    matches = sorted(SOURCE_DIR.glob(f"{prefix}*.html"))
    if not matches:
        sys.exit(f"Original page not found in {SOURCE_DIR}: {prefix}*.html")
    return matches[0]


def fmt_bytes(n: int) -> str:
    return f"{n / 1024:.0f} KB" if n < 1_000_000 else f"{n / 1_048_576:.1f} MB"


def main() -> None:
    results: list[PageAudit] = []
    for page, src_prefix, dist_rel in PAGE_MAP:
        src_html = find_source(src_prefix)
        src_assets = src_html.with_name(src_html.stem + "_files")
        a_bytes, a_files = dir_size(src_assets) if src_assets.is_dir() else (0, 0)
        results.append(audit_html(page, "original", src_html, a_bytes, a_files))

        dist_html = DIST_DIR / dist_rel
        if not dist_html.is_file():
            sys.exit(f"Rebuilt page not found: {dist_html} (run `npm run build` in site/)")
        soup = BeautifulSoup(dist_html.read_text(encoding="utf-8"), "lxml")
        r_bytes, r_files = referenced_asset_size(dist_html, soup, DIST_DIR)
        results.append(audit_html(page, "rebuild", dist_html, r_bytes, r_files))

    OUT_DIR.mkdir(exist_ok=True)
    (OUT_DIR / "report.json").write_text(json.dumps([asdict(r) for r in results], indent=2), encoding="utf-8")

    # Markdown comparison
    metrics = [
        ("HTML size", "html_bytes", fmt_bytes),
        ("Local assets referenced/downloaded", "asset_bytes", fmt_bytes),
        ("Asset file count", "asset_files", str),
        ("`<h1>` elements (should be 1)", "h1_count", str),
        ("Empty headings", "empty_headings", str),
        ("Heading level skips", "heading_level_skips", str),
        ("Images", "images", str),
        ("Images with no `alt` attribute", "images_missing_alt", str),
        ("Images with empty `alt`", "images_empty_alt", str),
        ("Links", "links", str),
        ("Duplicated text blocks (distinct)", "duplicate_text_blocks", str),
        ("Duplicated text blocks (total occurrences)", "duplicate_text_occurrences", str),
        ("Clickable `tel:` phone links", "tel_links", str),
        ("Inline `<script>` blocks", "inline_scripts", str),
        ("Third-party script hosts", "third_party_script_hosts", lambda v: str(len(v))),
        ("`hreflang` alternates", "hreflang_alternates", str),
    ]
    lines = ["# Structure & accessibility audit: original vs. rebuild", "",
             "Generated by `tools/audit.py` from the saved original pages and the built site.", ""]
    for page, _, _ in PAGE_MAP:
        orig = next(r for r in results if r.page == page and r.version == "original")
        new = next(r for r in results if r.page == page and r.version == "rebuild")
        lines += [f"## {page}", "", "| Metric | Original | Rebuild |", "|---|---:|---:|"]
        for label, key, fmt in metrics:
            lines.append(f"| {label} | {fmt(getattr(orig, key))} | {fmt(getattr(new, key))} |")
        if orig.third_party_script_hosts:
            lines += ["", f"Original third-party script hosts: {', '.join(orig.third_party_script_hosts)}"]
        lines.append("")
    (OUT_DIR / "report.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))

    if "--gate" in sys.argv:
        failures = gate(results)
        if failures:
            print("\nACCESSIBILITY GATE FAILED:")
            for f in failures:
                print("  -", f)
            sys.exit(1)
        print("\nAccessibility gate passed: every rebuilt page has one h1, no empty/skipped headings, "
              "no images without alt, no duplicated content, no inline scripts.")


def gate(results: list[PageAudit]) -> list[str]:
    """Rules every REBUILT page must satisfy. Returns a list of human-readable failures."""
    failures = []
    for r in results:
        if r.version != "rebuild":
            continue
        checks = [
            (r.h1_count == 1, f"{r.page}: expected exactly 1 <h1>, found {r.h1_count}"),
            (r.empty_headings == 0, f"{r.page}: {r.empty_headings} empty heading(s)"),
            (r.heading_level_skips == 0, f"{r.page}: {r.heading_level_skips} heading level skip(s)"),
            (r.images_missing_alt == 0, f"{r.page}: {r.images_missing_alt} image(s) without an alt attribute"),
            (r.duplicate_text_blocks == 0, f"{r.page}: {r.duplicate_text_blocks} duplicated text block(s)"),
            (r.inline_scripts == 0, f"{r.page}: {r.inline_scripts} inline <script> block(s) (breaks the CSP)"),
            (r.has_lang and r.has_skip_link and r.has_main, f"{r.page}: missing lang attribute, skip link, or <main>"),
        ]
        failures += [msg for ok, msg in checks if not ok]
    return failures


if __name__ == "__main__":
    main()
