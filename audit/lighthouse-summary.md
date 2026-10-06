# Lighthouse summary

Lighthouse 12.8.2, mobile emulation. The original was measured before the rebuild; the rebuild pages were measured on the live Cloudflare site on 2026-10-06. The full reports are the JSON files in this folder; open one in the Lighthouse viewer (https://googlechrome.github.io/lighthouse/viewer/) to read it.

| Page | Performance | Accessibility | Best practices | SEO | Transferred | Requests | LCP | Failing a11y audits |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| original-home | 55 | 85 | 71 | 92 | 9.0 MB | 133 | 36.5 s | color-contrast, link-name, list, tabindex, target-size, label-content-name-mismatch |
| rebuild-home | 96 | 100 | 100 | 100 | 0.2 MB | 29 | 2.6 s | none |
| rebuild-visas | 98 | 100 | 100 | 100 | 0.2 MB | 24 | 2.4 s | none |
