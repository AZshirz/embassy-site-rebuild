"""
Generate a static map of the embassy as a self-hosted image.

Why not an embedded map: the site's Content-Security-Policy is `img-src 'self' data:` and
`script-src 'self'`, so a Google/Mapbox/Leaflet embed would need the CSP widened in three places
and would load third-party script and tiles into a government-styled page - which also means a
third party sees every visitor. A flat image served from the site's own origin needs none of
that, works with JavaScript disabled, costs one request, and cannot track anyone.

Tiles come from OpenStreetMap, whose data is ODbL-licensed: the page MUST credit
"(c) OpenStreetMap contributors" wherever the image appears. The contact section does.

Run once (or whenever the embassy moves):
    pip install pillow requests
    python tools/make_map.py

Writes site/public/img/map-embassy-{1200,600}.webp. The output is committed, so neither the
build nor CI ever calls the tile server.
"""
import math
import io
import sys
from pathlib import Path

try:
    import requests
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("needs: pip install pillow requests")

LAT, LNG = 40.3777, 49.8536          # embassy.geo in site/src/data/content.ts
ZOOM = 16
WIDTH, HEIGHT = 1200, 540            # the 2x asset; a half-size copy is written too
TILE = 256
OUT = Path("site/public/img")
# OSM's tile usage policy requires a real identifying User-Agent, not a browser string.
UA = "embassy-site-rebuild/1.0 (portfolio project; https://github.com/AZshirz/embassy-site-rebuild)"


def world_px(lat: float, lng: float, zoom: int) -> tuple[float, float]:
    """Latitude/longitude to absolute pixel coordinates in the Web Mercator tile grid."""
    n = 2 ** zoom
    x = (lng + 180.0) / 360.0 * n
    lat_rad = math.radians(lat)
    y = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
    return x * TILE, y * TILE


def build() -> Image.Image:
    cx, cy = world_px(LAT, LNG, ZOOM)
    left, top = cx - WIDTH / 2, cy - HEIGHT / 2
    x0, y0 = int(left // TILE), int(top // TILE)
    x1, y1 = int((left + WIDTH) // TILE), int((top + HEIGHT) // TILE)

    canvas = Image.new("RGB", ((x1 - x0 + 1) * TILE, (y1 - y0 + 1) * TILE), "#e8e4dd")
    session = requests.Session()
    session.headers["User-Agent"] = UA

    total = (x1 - x0 + 1) * (y1 - y0 + 1)
    fetched = 0
    for tx in range(x0, x1 + 1):
        for ty in range(y0, y1 + 1):
            url = f"https://tile.openstreetmap.org/{ZOOM}/{tx}/{ty}.png"
            r = session.get(url, timeout=30)
            r.raise_for_status()
            tile = Image.open(io.BytesIO(r.content)).convert("RGB")
            canvas.paste(tile, ((tx - x0) * TILE, (ty - y0) * TILE))
            fetched += 1
            print(f"  tile {fetched}/{total}", end="\r")
    print()

    img = canvas.crop((
        int(left - x0 * TILE), int(top - y0 * TILE),
        int(left - x0 * TILE) + WIDTH, int(top - y0 * TILE) + HEIGHT,
    ))

    # Marker: a navy pin with a white ring, in the site's own palette rather than a stock red.
    d = ImageDraw.Draw(img)
    mx, my = WIDTH // 2, HEIGHT // 2
    r_out, r_in = 20, 11
    d.ellipse((mx - r_out, my - r_out, mx + r_out, my + r_out), fill="#ffffff")
    d.ellipse((mx - r_in, my - r_in, mx + r_in, my + r_in), fill="#162e51")
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img = build()
    big = OUT / f"map-embassy-{WIDTH}.webp"
    small = OUT / f"map-embassy-{WIDTH // 2}.webp"
    img.save(big, "WEBP", quality=80, method=6)
    img.resize((WIDTH // 2, HEIGHT // 2), Image.LANCZOS).save(small, "WEBP", quality=80, method=6)
    for p in (big, small):
        print(f"{p}  {p.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
