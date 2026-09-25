// Builds a local side-by-side viewer for two sets of screenshots, so a design change can be
// judged against the current live design before anything is pushed.
//
// Nothing here is deployed and nothing costs anything: it reads two folders of PNGs written by
// scripts/screenshot.mjs and writes one HTML file that references them from disk.
//
// Usage:
//   node scripts/compare.mjs <baselineLabel> <candidateLabel> [shotsDir]
//   node scripts/compare.mjs live redesign
//
// Typical loop (from site/, with a build served by `npx astro preview` on 4321):
//   git switch main      && npm run build && node scripts/screenshot.mjs http://localhost:4321 ../audit/shots/live
//   git switch design/x  && npm run build && node scripts/screenshot.mjs http://localhost:4321 ../audit/shots/redesign
//   node scripts/compare.mjs live redesign     # then open the path it prints
import { readdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

const [a = 'live', b = 'redesign', shotsDir = '../audit/shots'] = process.argv.slice(2);
const root = resolve(shotsDir);
const dirA = resolve(root, a);
const dirB = resolve(root, b);

for (const [label, dir] of [[a, dirA], [b, dirB]]) {
  if (!existsSync(dir)) {
    console.error(`No screenshots for "${label}" at ${dir}`);
    console.error('Run scripts/screenshot.mjs with that folder as its second argument first.');
    process.exit(1);
  }
}

const pngs = (d) => readdirSync(d).filter((f) => f.endsWith('.png')).sort();
// Only compare shots that exist on both sides; a page added by the redesign has nothing to sit next to.
const shared = pngs(dirA).filter((f) => pngs(dirB).includes(f));
const onlyB = pngs(dirB).filter((f) => !pngs(dirA).includes(f));

if (!shared.length) {
  console.error('The two folders have no screenshots in common.');
  process.exit(1);
}

const out = resolve(root, `compare-${a}-vs-${b}.html`);
const rel = (dir, file) => relative(root, resolve(dir, file)).split(sep).join('/');

// Two modes per pair: "side by side" (both at half width) and "swipe" (stacked, clipped by a slider).
// Swipe is the one that catches small changes - colour, spacing, weight - that the eye edits out
// when the images are apart.
const section = (file) => `
  <section class="pair" data-name="${file}">
    <h2>${file.replace(/\.png$/, '')}</h2>
    <div class="modes">
      <button type="button" class="active" data-mode="side">Side by side</button>
      <button type="button" data-mode="swipe">Swipe</button>
    </div>
    <div class="side">
      <figure><figcaption>${a}</figcaption><img src="${rel(dirA, file)}" alt="${a}: ${file}" loading="lazy"></figure>
      <figure><figcaption>${b}</figcaption><img src="${rel(dirB, file)}" alt="${b}: ${file}" loading="lazy"></figure>
    </div>
    <div class="swipe" hidden>
      <div class="swipe-stack">
        <img class="under" src="${rel(dirA, file)}" alt="${a}: ${file}" loading="lazy">
        <div class="over-clip"><img class="over" src="${rel(dirB, file)}" alt="${b}: ${file}" loading="lazy"></div>
        <div class="handle"></div>
      </div>
      <label>${a} <input type="range" min="0" max="100" value="50"> ${b}</label>
    </div>
  </section>`;

const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${a} vs ${b}</title>
<style>
  :root { color-scheme: light dark; --bg: #fff; --fg: #1b1b1b; --line: #dfe1e2; --muted: #565c65; }
  @media (prefers-color-scheme: dark) { :root { --bg: #16181a; --fg: #f0f0f0; --line: #3d4551; --muted: #a9aeb1; } }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 1.5rem; background: var(--bg); color: var(--fg);
         font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  header { border-bottom: 2px solid var(--line); padding-bottom: 1rem; margin-bottom: 1.5rem; }
  h1 { margin: 0 0 .25rem; font-size: 1.4rem; }
  .meta { color: var(--muted); font-size: .9rem; margin: 0; }
  .pair { margin-bottom: 3rem; }
  .pair h2 { font-size: 1.05rem; margin: 0 0 .5rem; }
  .modes { display: flex; gap: .5rem; margin-bottom: .75rem; }
  .modes button { font: inherit; font-size: .85rem; padding: .3rem .8rem; cursor: pointer;
                  border: 1px solid var(--line); background: transparent; color: var(--fg); border-radius: 4px; }
  .modes button.active { background: #005ea2; border-color: #005ea2; color: #fff; }
  .side { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
  figure { margin: 0; }
  figcaption { font-size: .8rem; color: var(--muted); margin-bottom: .35rem; text-transform: uppercase; letter-spacing: .04em; }
  img { width: 100%; height: auto; display: block; border: 1px solid var(--line); }
  .swipe-stack { position: relative; }
  .swipe-stack .under { width: 100%; }
  .over-clip { position: absolute; inset: 0; overflow: hidden; width: 50%; border-right: 2px solid #005ea2; }
  .over-clip .over { position: absolute; top: 0; left: 0; height: 100%; width: auto; max-width: none; border: 0; }
  .swipe label { display: flex; align-items: center; gap: .75rem; font-size: .8rem;
                 color: var(--muted); margin-top: .5rem; text-transform: uppercase; letter-spacing: .04em; }
  .swipe input { flex: 1; }
  .note { color: var(--muted); font-size: .9rem; }
</style>
<header>
  <h1>${a} vs ${b}</h1>
  <p class="meta">${shared.length} page${shared.length === 1 ? '' : 's'} compared · generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</p>
  ${onlyB.length ? `<p class="note">Only in <strong>${b}</strong>, nothing to compare against: ${onlyB.join(', ')}</p>` : ''}
</header>
${shared.map(section).join('\n')}
<script>
  for (const pair of document.querySelectorAll('.pair')) {
    const side = pair.querySelector('.side');
    const swipe = pair.querySelector('.swipe');
    for (const btn of pair.querySelectorAll('.modes button')) {
      btn.addEventListener('click', () => {
        for (const b of pair.querySelectorAll('.modes button')) b.classList.toggle('active', b === btn);
        const wantSwipe = btn.dataset.mode === 'swipe';
        side.hidden = wantSwipe;
        swipe.hidden = !wantSwipe;
        if (wantSwipe) sizeOverlay(pair);
      });
    }
    // The clipped copy must be drawn at the same pixel width as the image underneath it,
    // otherwise the two halves do not line up and every comparison looks like a change.
    const range = pair.querySelector('input[type=range]');
    range.addEventListener('input', () => {
      pair.querySelector('.over-clip').style.width = range.value + '%';
    });
  }
  function sizeOverlay(pair) {
    const under = pair.querySelector('.under');
    const over = pair.querySelector('.over');
    const apply = () => { over.style.width = under.clientWidth + 'px'; over.style.height = 'auto'; };
    under.complete ? apply() : under.addEventListener('load', apply, { once: true });
  }
  addEventListener('resize', () => document.querySelectorAll('.pair').forEach(sizeOverlay));
</script>
</html>`;

writeFileSync(out, html);
console.log(`wrote ${out}`);
console.log(`${shared.length} page(s) compared${onlyB.length ? `; ${onlyB.length} only in "${b}"` : ''}`);
