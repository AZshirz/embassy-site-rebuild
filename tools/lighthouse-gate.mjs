// CI gate: run Lighthouse against a locally served build and fail if scores drop below the bar.
// Usage: node tools/lighthouse-gate.mjs http://localhost:4321/ [more urls...]
// Requires: `npx lighthouse` available (installed on the fly in CI) and Chrome on the machine.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';

const MIN = { accessibility: 100, 'best-practices': 90, seo: 90 }; // performance is not gated: it varies with the runner
const urls = process.argv.slice(2);
if (!urls.length) { console.error('usage: node tools/lighthouse-gate.mjs <url> [url...]'); process.exit(2); }

mkdirSync('audit/lighthouse-ci', { recursive: true });
let failed = false;
for (const url of urls) {
  const name = url.replace(/https?:\/\/[^/]+/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
  const out = `audit/lighthouse-ci/${name}.json`;
  rmSync(out, { force: true });
  try {
    execSync(`npx --yes lighthouse@12 ${url} --preset=desktop --quiet --output=json --output-path=${out} --chrome-flags="--headless=new --no-sandbox"`, { stdio: 'pipe' });
  } catch (e) {
    // On Windows, Lighthouse writes the report and then fails cleaning its temp folder (EPERM).
    // The report is what matters; only give up if it was not written.
    if (!existsSync(out)) { console.error(String(e.stderr || e.message)); process.exit(1); }
  }
  const r = JSON.parse(readFileSync(out, 'utf8'));
  const scores = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
  const bad = Object.entries(MIN).filter(([k, min]) => scores[k] < min);
  console.log(`${url}: ${JSON.stringify(scores)} ${bad.length ? 'FAIL' : 'ok'}`);
  for (const [k, min] of bad) {
    failed = true;
    const audits = r.categories[k].auditRefs.map((x) => r.audits[x.id]).filter((a) => a.score !== null && a.score < 1).map((a) => a.id);
    console.log(`  ${k} ${scores[k]} < ${min}; failing audits: ${audits.join(', ')}`);
  }
}
process.exit(failed ? 1 : 0);
