"""
Generate the 1200x630 image social networks show when someone shares a link to the site
(LinkedIn, Slack, email previews - the og:image in site/src/layouts/Base.astro).

The card is deliberately branded as an unofficial portfolio, with that said in the strip across
the top. A link preview is exactly where a rebuild of an embassy page could be mistaken for the
real thing, so it never presents itself as the embassy.

Uses the USWDS fonts the site already ships (SIL Open Font License). Neither font contains an
arrow glyph - "->" rendered as an empty box - so the arrows are drawn as shapes.

Run once, or whenever the numbers change:
    pip install pillow
    python tools/make_social_card.py
Writes site/public/img/social-card.png, which is committed.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONTS = Path("site/public/uswds/fonts")
OUT = Path("site/public/img/social-card.png")
W, H, LEFT = 1200, 630, 72

NAVY, TILE, TILE_EDGE = "#162e51", "#1f3c64", "#3b5b86"
WHITE, SOFT, MUTED, GOLD = "#ffffff", "#dfe1e2", "#a9aeb1", "#ffbe2e"
NOTICE_BG, NOTICE_FG = "#fff8e1", "#3d2b00"          # the site's own demo-notice colours

# Every figure is a measured one: Lighthouse mobile emulation, home page, original vs live rebuild.
METRICS = [
    ("9.0 MB", "0.3 MB", "home page weight"),
    ("133", "29", "network requests"),
    ("85", "100", "Lighthouse accessibility"),
]


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def arrow(d: ImageDraw.ImageDraw, x: int, cy: int, length: int = 34) -> int:
    """Draw a right-pointing arrow starting at x, centred on cy. Returns the x after it."""
    d.line([(x, cy), (x + length - 10, cy)], fill=GOLD, width=5)
    d.polygon([(x + length - 14, cy - 11), (x + length, cy), (x + length - 14, cy + 11)], fill=GOLD)
    return x + length


def main() -> None:
    sans = lambda size: font("source-sans-pro/sourcesanspro-regular-webfont.ttf", size)
    sans_bold = lambda size: font("source-sans-pro/sourcesanspro-bold-webfont.ttf", size)
    serif_bold = lambda size: font("merriweather/Latin-Merriweather-Bold.ttf", size)

    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)

    # The disclaimer, first and full width.
    d.rectangle([0, 0, W, 62], fill=NOTICE_BG)
    d.text((LEFT, 31), "UNOFFICIAL PORTFOLIO DEMONSTRATION · NOT AFFILIATED WITH THE U.S. DEPARTMENT OF STATE",
           font=sans_bold(21), fill=NOTICE_FG, anchor="lm")

    d.text((LEFT, 112), "A rebuild of four pages of az.usembassy.gov", font=sans(30), fill=MUTED, anchor="lm")
    d.text((LEFT, 186), "Embassy Site Rebuild", font=serif_bold(70), fill=WHITE, anchor="lm")
    d.text((LEFT, 262), "To the U.S. Web Design System, Section 508 accessibility", font=sans(32), fill=SOFT, anchor="lm")
    d.text((LEFT, 302), "and a strict Content-Security-Policy, measured before and after.", font=sans(32), fill=SOFT, anchor="lm")

    # Three measured results.
    gap, top, height = 24, 372, 150
    width = (W - 2 * LEFT - 2 * gap) // 3
    for i, (before, after, label) in enumerate(METRICS):
        x0 = LEFT + i * (width + gap)
        d.rounded_rectangle([x0, top, x0 + width, top + height], radius=10, fill=TILE, outline=TILE_EDGE, width=2)
        # The same size in every tile, chosen so the widest one fits: "9.0 MB -> 0.3 MB" overflowed at 46.
        size = 46
        while size > 20 and max(sans_bold(size).getlength(b) + sans_bold(size).getlength(a) + 28 + 34
                                for b, a, _ in METRICS) > width - 52:
            size -= 1
        big = sans_bold(size)
        cy = top + 58
        x = x0 + 26
        d.text((x, cy), before, font=big, fill=SOFT, anchor="lm")
        x = arrow(d, x + int(big.getlength(before)) + 14, cy + 2) + 14
        d.text((x, cy), after, font=big, fill=WHITE, anchor="lm")
        d.text((x0 + 26, top + 116), label, font=sans(26), fill=MUTED, anchor="lm")

    d.text((LEFT, 576), "Deployed twice: AWS, and Google Cloud with Cloudflare · github.com/AZshirz/embassy-site-rebuild",
           font=sans(23), fill=MUTED, anchor="lm")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"{OUT}  {OUT.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
