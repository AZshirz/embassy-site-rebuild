"""
Prepare photos for the site: resize + convert to WebP at the exact widths the pages use.

Usage (from the repo root):
    python tools/optimize_images.py

Input:  photos saved with the original pages (Source/*_files/), all U.S. Government work
        (official portraits, embassy event photos, State Department report covers).
Output: site/public/img/photos/<name>-<width>.webp

Only images listed in PHOTOS are processed, so a third-party photo can't slip in by accident
(the original home-page hero, for example, is credited to a news agency and is deliberately excluded).
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Source" / "Homepage - U.S. Embassy in Azerbaijan_files"
OUT = ROOT / "site" / "public" / "img" / "photos"

# (source file, output name, widths to generate, optional crop aspect ratio w:h)
PHOTOS = [
    ("3-scaled.jpg",                          "hero-azeta",   [800, 1600], (16, 7)),
    ("3-scaled.jpg",                          "news-azeta",   [480],       (16, 10)),
    ("cda-ismayilliexcom.jpg",                "news-ismayilli", [480],     (16, 10)),
    ("cda-cola-1.jpg",                        "news-cocacola", [480],      (16, 10)),
    ("Amy-Carlon-scaled.jpg",                 "carlon",       [320],       (1, 1)),
    ("dcm-sharma.jpg",                        "sharma",       [320],       (1, 1)),
    ("2025_TIP_Report_Cover_Sept25_REBRAND.jpg", "report-tip", [240],      None),
    ("humanrightsreport2020_v3.png",          "report-hrr",   [240],       None),
    ("IRF-Report-Cover-2023.png",             "report-irf",   [240],       None),
]

QUALITY = 78


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    total_in = total_out = 0
    for src_name, out_name, widths, aspect in PHOTOS:
        src = SRC / src_name
        if not src.is_file():
            print(f"skip (missing): {src_name}")
            continue
        total_in += src.stat().st_size
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        if aspect:
            # Centre-crop to the requested aspect ratio (portraits are cropped slightly toward the top).
            aw, ah = aspect
            w, h = im.size
            if w / h > aw / ah:
                new_w = int(h * aw / ah)
                left = (w - new_w) // 2
                im = im.crop((left, 0, left + new_w, h))
            else:
                new_h = int(w * ah / aw)
                top = (h - new_h) // 3 if aw == ah else (h - new_h) // 2
                im = im.crop((0, top, w, top + new_h))
        for width in widths:
            if im.width < width:
                print(f"note: {src_name} is only {im.width}px wide; upscaling avoided, saving at native width")
            out_im = im.copy()
            out_im.thumbnail((width, 100_000))
            dest = OUT / f"{out_name}-{width}.webp"
            out_im.save(dest, "WEBP", quality=QUALITY, method=6)
            total_out += dest.stat().st_size
            print(f"{dest.name:28} {out_im.width}x{out_im.height}  {dest.stat().st_size / 1024:6.1f} KB")
    print(f"\ninput {total_in / 1_048_576:.1f} MB -> output {total_out / 1024:.0f} KB")


if __name__ == "__main__":
    main()
