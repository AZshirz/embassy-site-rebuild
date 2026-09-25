# CLAUDE.md — working notes for this repository

Read this before changing anything. It records the things that are not obvious from the
code and that have already cost a session to rediscover.

## This repo is one project on two branches, not two projects

| | `main` | `aws` |
|---|---|---|
| Static site | Cloudflare Workers | S3 (private) + CloudFront |
| API | Google Cloud Run (container) | Lambda (zip) + Function URL |
| Site ↔ API | different domains, CORS required | one domain, `/api/*` → Lambda, no CORS |
| `PUBLIC_API_URL` | absolute (`https://….run.app`) | relative (`/api`) |
| Security headers | `site/headers.template` → `dist/_headers` | CloudFront response-headers policy |
| Infrastructure | configured in dashboards | CloudFormation in `aws/cloudformation/` |
| Deploy trigger | Cloudflare Workers Builds, **independent of CI** | `.github/workflows/deploy-aws.yml` (gated) |

`aws` is ahead of `main`; `main` has nothing `aws` lacks. They differ by ~12 files.

**Only three files under `site/` differ between the branches**, and all three differ *only* over
whether the API origin is absolute or relative:

- `site/scripts/write-headers.mjs`
- `site/src/data/api.ts`
- `site/src/layouts/Base.astro`  ← the layout, so it is the file a redesign most wants to touch

Everything else in `site/` is byte-identical. **Do UI work once, on `main`, then merge into `aws`.**
Never edit the same UI file separately on both branches.

Expect a small conflict in `Base.astro` on every merge (one CSP line: `API_ORIGIN` vs
`API_CSP_SOURCE`). Keep the `aws` side when merging into `aws`.

## Content-Security-Policy lives in three places — change all three or one site breaks

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none';
base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

1. `site/src/layouts/Base.astro` — the `<meta>` fallback, both branches
2. `site/headers.template` — the HTTP header Cloudflare sends (`main` path)
3. `aws/cloudformation/stack.yml` (~line 218) — the CloudFront response-headers policy (`aws` path)

Miss #3 and the AWS site breaks while Cloudflare looks fine.

Consequences for design work:
- **No external fonts, CDNs, icon services or remote images.** `font-src 'self'`, `img-src 'self' data:`.
  Self-host anything new; do not widen the CSP.
- **No inline `<script>`.** Put JS in `site/public/js/` and reference it. The audit gate fails on
  inline scripts anyway.
- Inline `style=` attributes are fine (`style-src` allows `'unsafe-inline'`).

## The gates that must keep passing

`tools/audit.py --gate` — every rebuilt page must have:
exactly one `<h1>`, no empty headings, no heading-level skips, no `<img>` without `alt`,
zero duplicated text blocks, zero inline scripts, plus `lang`, a skip link and `<main>`.

`tools/lighthouse-gate.mjs` — accessibility **100**, best-practices ≥ 90, SEO ≥ 90.
Performance is deliberately not gated (it varies with the runner).

Two design patterns these rules quietly forbid:
- **Cloned carousel slides / duplicated desktop+mobile markup** → fails `duplicate_text_blocks`.
  Removing exactly this from the original is the project's central argument; see README.
- **Any contrast below 4.5:1** → drops accessibility below 100 and fails CI.

## Deploy paths differ in safety — know which branch you are on

- `aws`: `deploy-aws.yml` runs the accessibility gate **before** deploying. A regression stops
  the deploy. Safe.
- `main`: Cloudflare Workers Builds deploys on push, **independently of `ci.yml`**. A red CI does
  *not* block it. A bad commit pushed straight to `main` goes live. Work on a branch and merge.

### The rule that closes the `main` gap

**Never push UI work straight to `main`.** Work on a `design/*` branch, let `ci.yml` run there,
compare screenshots (below), then merge. This is process, not infrastructure, and it is the
agreed approach — do not wire Cloudflare deployment into GitHub Actions without asking.

### Cloudflare Workers Builds configuration (as of 2026-09-24)

- **Production → Branch control: `main`.** Only `main` deploys to the live site.
- **Previews Base → "Builds for Preview branches": OFF.** No branch gets a hosted preview URL.
- Root directory `site`, build `npm run build`, deploy `npx wrangler deploy`.

Consequence: the failing **"Workers Builds: embassy-site-rebuild"** check on `aws` HEAD
(f8e343c, built 2026-09-24T05:51Z) is **historical**. It ran before branch control was narrowed
to `main`. No new Workers build is triggered on `aws`, so the next commit there carries only the
four GitHub Actions checks. Do not "fix" it by re-enabling preview builds — that reintroduces the
failure on every `aws` push.

## Comparing design iterations

Entirely local, no hosting, no cost. `scripts/screenshot.mjs` captures all pages at desktop and
phone widths into a labelled folder; `scripts/compare.mjs` builds a viewer with a side-by-side
mode and a swipe slider.

```powershell
cd site
git switch main        ; npm run build ; npx astro preview --port 4321   # in another terminal:
node scripts/screenshot.mjs http://localhost:4321 ../audit/shots/live
git switch design/xyz  ; npm run build ; npx astro preview --port 4321
node scripts/screenshot.mjs http://localhost:4321 ../audit/shots/redesign
node scripts/compare.mjs live redesign      # open the path it prints
```

`audit/shots/` is gitignored. A baseline of the current live design is already captured under
`audit/shots/live/`. `screenshot.mjs` hardcodes the Windows Chrome path.

## Cost: $0, and why it stays that way

Guardrails are in the templates, not in anyone's discipline: CloudWatch `RetentionInDays: 7`,
S3 lifecycle expiry on Lambda zips, `PriceClass_100`, Lambda concurrency cap, Cloud Run min 0 /
max 1, no NAT/VPC/API Gateway.

UI/UX work is cost-neutral by construction — static assets on free tiers. The only way to spend
money is to make the pages call the API far more often, and even then the free allowances are
orders of magnitude away. The real $0 risk is the **AWS Free Plan account expiry** (6 months,
then AWS deletes resources) — see `aws/README.md`.

## Commit authorship

Author every commit as `Adam Shirzadian <330568160+AZshirz@users.noreply.github.com>`.
Do **not** add `Co-Authored-By: Claude` trailers. All 49 commits on both remote branches already
use this single identity; the GitHub contributors API reports exactly one contributor.

`.github/workflows/alerts.yml` also commits under this identity rather than `github-actions[bot]`,
so the daily advisory job can never become a second contributor.

A prior session rewrote history to achieve this (`git filter-branch`). Leftovers exist **locally
only**: `refs/original/**` and the tag `backup-before-rewrite-20260923`. `refs/original/**` still
contains the old `sshirzad2013@gmail.com`-authored commits. Never push those refs. Deleting them
changes nothing on GitHub — it only discards the local pre-rewrite backup.

## Layout

```
site/          Astro + USWDS 3 static site
  src/data/content.ts        ALL text, EN + AZ. Editing copy never touches a template.
  src/layouts/Base.astro     <head>, CSP, banner, header, footer, structured data
  src/components/            USWDS components + the page templates
  public/css/site.css        284 lines of layout glue on top of USWDS. Small on purpose.
  public/js/                 site.js, search.js, feedback.js, ask.js — no bundler, no framework
api/           FastAPI: main.py, advisories.py, ask.py, lambda_handler.py (aws only), tests
tools/         audit.py (--gate), lighthouse-gate.mjs, fetch_alerts.py, optimize_images.py
aws/           CloudFormation templates + AWS deployment README   (aws branch only)
```

## Local commands

```powershell
cd site; npm install; npm run dev          # http://localhost:4321
cd site; npm run build; npx astro preview  # then, from the repo root:
python tools/audit.py --gate
node tools/lighthouse-gate.mjs http://localhost:4321/
cd api; python -m pytest -q                # 21 tests, no network
```
