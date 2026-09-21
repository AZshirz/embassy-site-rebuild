// Summarises Lighthouse JSON reports in audit/lighthouse/ into audit/lighthouse-summary.md
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const dir = 'audit/lighthouse';
const rows = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith('.report.json')).sort()) {
  const r = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const s = (k) => Math.round(r.categories[k].score * 100);
  const a11yFails = r.categories.accessibility.auditRefs
    .map((x) => r.audits[x.id]).filter((a) => a.score !== null && a.score < 1).map((a) => a.id);
  rows.push({
    name: f.replace('.report.json', ''), url: r.finalDisplayedUrl,
    perf: s('performance'), a11y: s('accessibility'), bp: s('best-practices'), seo: s('seo'),
    kb: Math.round(r.audits['total-byte-weight'].numericValue / 1024),
    requests: r.audits['network-requests'].details.items.length,
    lcp: r.audits['largest-contentful-paint'].displayValue,
    a11yFails,
  });
}
const md = [
  '# Lighthouse summary', '',
  `Lighthouse ${JSON.parse(readFileSync(`${dir}/${readdirSync(dir).find((f) => f.endsWith('.report.json'))}`, 'utf8')).lighthouseVersion}, mobile emulation, run locally. Full HTML reports are in this folder.`, '',
  '| Page | Performance | Accessibility | Best practices | SEO | Transferred | Requests | LCP | Failing a11y audits |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---|',
  ...rows.map((r) => `| ${r.name} | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} | ${(r.kb / 1024).toFixed(1)} MB | ${r.requests} | ${r.lcp} | ${r.a11yFails.join(', ') || 'none'} |`),
  '',
].join('\n');
writeFileSync('audit/lighthouse-summary.md', md);
console.log(md);
