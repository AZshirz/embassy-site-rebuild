// CI gate: run Lighthouse against a locally served build and fail if scores drop below the bar.
//
// Usage:
//   node tools/lighthouse-gate.mjs <url> [url...]                      desktop preset (the default)
//   node tools/lighthouse-gate.mjs --mobile --max-cls=0.1 <url> [...]   phone, real network throttling
//
// Requires: `npx lighthouse` available (installed on the fly in CI) and Chrome on the machine.
//
// Why a separate mobile mode: until 2026-10-04 this ran desktop only and did not look at layout
// shift, and mobile CLS crept from 0 to 0.13-0.25 on the live sites with every check green - the
// first screen painted in fallback fonts and reflowed when the USWDS fonts arrived. Lighthouse's
// default "simulated" throttling replays a fast local load, so against localhost the fonts arrive
// instantly and the shift never appears. --throttling-method=devtools really slows the network,
// which is what made the regression reproducible (0.148 without the font preloads, 0 with them).
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';

const MIN = { accessibility: 100, 'best-practices': 90, seo: 90 }; // performance is not gated: it varies with the runner

const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const clsArg = args.find((a) => a.startsWith('--max-cls='));
const maxCls = clsArg ? Number(clsArg.split('=')[1]) : null;
const urls = args.filter((a) => !a.startsWith('--'));
if (!urls.length) {
  console.error('usage: node tools/lighthouse-gate.mjs [--mobile] [--max-cls=0.1] <url> [url...]');
  process.exit(2);
}

const mode = mobile ? '--throttling-method=devtools' : '--preset=desktop';
mkdirSync('audit/lighthouse-ci', { recursive: true });
let failed = false;
for (const url of urls) {
  const name = (url.replace(/https?:\/\/[^/]+/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home') + (mobile ? '-mobile' : '');
  const out = `audit/lighthouse-ci/${name}.json`;
  rmSync(out, { force: true });
  try {
    execSync(`npx --yes lighthouse@12 ${url} ${mode} --quiet --output=json --output-path=${out} --chrome-flags="--headless=new --no-sandbox"`, { stdio: 'pipe' });
  } catch (e) {
    // On Windows, Lighthouse writes the report and then fails cleaning its temp folder (EPERM).
    // The report is what matters; only give up if it was not written.
    if (!existsSync(out)) { console.error(String(e.stderr || e.message)); process.exit(1); }
  }
  const r = JSON.parse(readFileSync(out, 'utf8'));
  const scores = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
  const cls = r.audits['cumulative-layout-shift'].numericValue;
  const bad = Object.entries(MIN).filter(([k, min]) => scores[k] < min);
  const clsBad = maxCls !== null && cls > maxCls;
  console.log(`${url}${mobile ? ' [mobile]' : ''}: ${JSON.stringify(scores)} CLS ${cls.toFixed(3)} ${bad.length || clsBad ? 'FAIL' : 'ok'}`);
  for (const [k, min] of bad) {
    failed = true;
    const audits = r.categories[k].auditRefs.map((x) => r.audits[x.id]).filter((a) => a.score !== null && a.score < 1).map((a) => a.id);
    console.log(`  ${k} ${scores[k]} < ${min}; failing audits: ${audits.join(', ')}`);
  }
  if (clsBad) {
    failed = true;
    const shifted = (r.audits['layout-shifts']?.details?.items || []).slice(0, 3).map((i) => i.node?.selector).filter(Boolean);
    console.log(`  layout shift ${cls.toFixed(3)} > ${maxCls}; moved: ${shifted.join(' | ') || 'see the report'}`);
  }
}
process.exit(failed ? 1 : 0);
