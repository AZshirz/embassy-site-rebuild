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

Everything else in `site/` is byte-identical.

**One canonical address for both deployments (owner's decision, 2026-10-04).** Every page's canonical,
hreflang, `og:url` and `og:image` point at the Cloudflare origin (`Astro.site`), on AWS too. That is
deliberate: identical content at two addresses should name one original, so search engines do not treat
the copies as competing duplicates. Do not give AWS its own canonical. **Do UI work once, on `main`, then merge into `aws`.**
Never edit the same UI file separately on both branches.

`Base.astro` conflicts only when an edit lands next to its import of `API_ORIGIN` /
`API_CSP_SOURCE` or next to the CSP line; edits elsewhere in the file merge cleanly. When it does
conflict, keep the `aws` side of those lines when merging into `aws`.

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

`tools/audit.py --gate` — **every page the build produces** (15, including `/az/*`, Search, Ask,
Feedback and the 404 page) must have: exactly one `<h1>`, no empty headings, no heading-level skips,
no `<img>` without `alt`, zero duplicated text blocks, zero inline scripts, plus `lang`, a skip link
and `<main>`. (Until 2026-10-04 it checked only the four English pages that have an original.)

`tools/lighthouse-gate.mjs` — accessibility **100**, best-practices ≥ 90, SEO ≥ 90, and with
`--max-cls` a layout-shift budget. CI runs it twice:
- **desktop, all 14 indexable pages,** CLS ≤ 0.1;
- **`--mobile`, three pages, with real (devtools) network throttling,** CLS ≤ 0.1. The default
  simulated throttling replays a fast local load in which fonts arrive instantly, so font reflow
  can never show up without this.

The 404 page is not in the Lighthouse list: it is `noindex`, so it correctly fails SEO (63).
Performance is deliberately not gated (it varies with the runner). The site job takes about 5 minutes.

**Content revealed by JavaScript must hold its space from the first paint.** Use an invisible
placeholder (`visibility: hidden`, see `.site-hours-status[data-pending]`), never `hidden` /
`display: none` followed by a reveal. The header badge did the latter and pushed every page down
13px on desktop (CLS 0.13), unseen until the gate was widened.

Two design patterns these rules quietly forbid:
- **Cloned carousel slides / duplicated desktop+mobile markup** → fails `duplicate_text_blocks`.
  Removing exactly this from the original is the project's central argument; see README.
- **Any contrast below 4.5:1** → drops accessibility below 100 and fails CI.

## Caching: nothing here is fingerprinted

Astro hashes the assets it processes, but this site has none of those. Its CSS, JS, images and
vendored USWDS files are copied verbatim out of `site/public/`, and the build produces no
`_astro/` directory at all — every one of ~2,600 non-HTML files keeps a fixed name forever.

Two consequences, both learned the hard way:

- **Never mark these assets `immutable`.** `deploy-aws.yml` once did, on the assumption they were
  fingerprinted. `immutable` tells a browser not to revalidate *even on reload*, so every visitor
  was pinned to that day's stylesheet for a year, and the AWS site served new HTML with the old
  CSS — white sections, an unreadable Emergency button — while Cloudflare rendered the same commit
  correctly. **A CloudFront invalidation clears the CDN; it cannot reach a browser cache.** The
  deploy smoke test now fails if `/css/site.css` comes back immutable.
- **Reference stylesheets and scripts through `v()`** in `site/src/data/asset.ts`, which appends a
  build-time content hash (`/css/site.css?v=f25fdb49`). A changed file gets a new URL and is
  fetched; an unchanged one still comes from cache. This is also the only way to rescue browsers
  that already hold a poisoned copy.

## Client addresses and the edge: measured, not assumed

The rate limiter needs the visitor's address. What each platform delivers was measured on
2026-10-04 by sending forged headers from outside and reading back yes/no answers:

| | `X-Forwarded-For` | `CloudFront-Viewer-Address` | Used |
|---|---|---|---|
| Cloud Run | client's entries, then exactly **one** appended: the real client | passed through untouched (forgeable) | last XFF entry (`TRUSTED_PROXY_HOPS` defaults to 1 when `K_SERVICE` is set) |
| AWS | collapsed to **one** value by the Lambda URL layer; the client's own when it sends the header | always present; CloudFront overwrites forged copies | `CLIENT_IP_HEADER=cloudfront-viewer-address` (stack.yml) |

Consequences:
- **Never trust `X-Forwarded-For` on AWS, in any position.** Counting from the right fixes Cloud Run
  and does nothing on AWS.
- **Never trust `CloudFront-Viewer-Address` by default.** On Cloud Run a client can set it.
- **The Lambda refuses requests without CloudFront's `X-Origin-Verify` header** (`ORIGIN_VERIFY`,
  the stack's GUID), so the public Function URL cannot be used to skip CloudFront and forge the
  viewer address. Changing anything like this needs two deploys: first make CloudFront send the
  new header, then make the Lambda require it. In one deploy the Lambda changes instantly while
  CloudFront takes minutes, refusing every API call in between.

**CloudFront error pages apply to every behaviour, `/api/*` included.** That is why only **403** is
mapped to `/404.html`: S3 answers a missing object with 403 (private bucket, no list permission),
while the API raises real 404s that must stay JSON (`/api/alerts?country=Narnia`) and never raises a
403 itself. The smoke test asserts both halves. Do not add a 404 mapping.

`API_DOCS=off` on AWS: Swagger UI cannot work behind this CloudFront (CDN script blocked by the CSP,
`/openapi.json` requested at the root goes to S3). The schema is at `/api/openapi.json`.

## What the gates do not catch

Both gates passed continuously through three real defects that reached production:

- **A contrast ratio of exactly 1:1.** The header Emergency button rendered `#71767a` on `#d83933`
  because `.usa-nav__secondary-links a` (specificity 0,1,1) outranked `.usa-button--secondary`
  (0,1,0). Lighthouse reported accessibility **100** on every run, and not by sampling: axe
  measured the button, but files an exactly-1:1 ratio as `incomplete` (message key `equalRatio` -
  possibly deliberately hidden text) instead of a violation, and Lighthouse scores only violations.
  1.5:1 would have failed CI; 1:1 could not.
- **Anything cache-related.** Automated checks drive a fresh headless browser with an empty cache,
  so they fetch what was just deployed by definition. The stale-stylesheet bug was invisible to
  every check and obvious to anyone who had visited the site before.
- **Mobile layout shift** (now gated, see above). CI used to run Lighthouse with the desktop preset
  only and did not gate layout shift, so mobile CLS crept from 0 (Phase 1) to 0.13-0.25 unseen: the first screen painted
  in fallback fonts and reflowed when USWDS's arrived. Fixed with font preloads in `Base.astro`.
  Their URLs must stay exactly the ones the USWDS stylesheet requests - no `v()` - or each font
  downloads twice. To measure CLS locally, use `--throttling-method=devtools`; on localhost fonts
  arrive instantly and the shift never appears.

Measure a fix, too. Hiding the feedback form until its script ran - to stop a no-JS 422 - caused a
CLS of 0.48 of its own, caught only because the page was re-measured. The form now stays visible
and only its submit button starts disabled.

So: a green gate means no *known* regression, not a correct page. **After deploying, open both
live sites in a real browser that has visited them before.** The gates cannot do this part.

## Deploy paths differ in safety — know which branch you are on

- `aws`: `deploy-aws.yml` calls the **whole of `ci.yml`** as a reusable workflow, against the same
  `/api` build it ships, and the deploy job `needs:` it. Nothing reaches AWS unless every check
  passes; the smoke test then checks the live result.
- `main`: Cloudflare Workers Builds and Cloud Run deploy on push, **independently of `ci.yml`**.
  What stops an untested commit reaching them is a **GitHub ruleset on `main`** requiring the three
  CI checks (`Build site + accessibility gate`, `API tests`,
  `API container boots (what Cloud Run runs)`). Per GitHub's docs, once those checks have passed on
  a commit it can be pushed directly to the protected branch - so the workflow is: push to a
  `design/**` or `fix/**` branch, wait for CI, then fast-forward `main` to that same commit. A commit
  CI has not passed is refused. Created and verified 2026-10-04: an untested push was declined with
  "3 of 3 required status checks are expected". The bypass list is empty on purpose - Claude pushes
  with the owner's credentials, so an owner bypass would exempt Claude too.

### The rule that closes the `main` gap

**Never push work straight to `main`.** Work on a `design/**` or `fix/**` branch, let `ci.yml` run
there, compare screenshots (below), then fast-forward `main`. The ruleset enforces it; it used to be
a habit only. Do not wire Cloudflare deployment into GitHub Actions without asking.

**The daily `alerts.yml` job cannot bypass the ruleset** - GitHub Actions is not an allowed bypass
actor - and pushes made with a workflow's own token trigger no other workflows, so CI would never
run on its commit. It therefore pushes the update to `advisory/update-<run id>`, starts CI there
with `workflow_dispatch` (the one event that token can trigger), waits, and only then pushes the
same tested commit to `main`. Run it by hand with **rehearse** ticked to prove the path without
changing anything.

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

**Least privilege on both clouds.** Cloud Run runs as `embassy-api-runtime@embassy-site-rebuild.iam.gserviceaccount.com`,
which has **no roles** (since 2026-10-04; it used the default compute account before). The Lambda's
role can only write its own logs. Neither API calls any cloud service, so do not grant either one
anything - logs reach Cloud Logging and CloudWatch without it.

**GCP has a $6 spending cap, and hitting it takes the API down.** On 2026-10-04 every Cloud Run route returned 503 in ~85 ms -
the front end refusing, not a cold start - until the owner removed a GCP spending limit. The site
itself kept working, which is the design: search and Ask showed "temporarily unavailable" while the
advisory strip and all four emergency numbers still rendered. On 2026-10-05 the owner set a new cap
of **$6**. So if Cloud Run's API suddenly returns an instant 503 everywhere, check Billing first -
that is what it looked like last time. Find and stop whatever is spending rather than raising the cap.
Check Billing → Reports before claiming "$0" anywhere, and keep an Artifact Registry cleanup policy
so old container images do not accumulate storage.

## Commit authorship

Author every commit as `Adam Shirzadian <330568160+AZshirz@users.noreply.github.com>`.
Do **not** add `Co-Authored-By: Claude` trailers. Every commit on both remote branches uses this
single identity; the GitHub contributors API reports exactly one contributor.

`INTERVIEW_PREP.md`, `STUDY_GUIDE.md` and `OWNER_ACTIONS.md` at the repo root are the owner's private
notes. They are ignored through `.git/info/exclude` (local only, deliberately not `.gitignore`) so that
`git add -A` cannot publish them. Never commit them, and never move them into a tracked path.

**Keep `OWNER_ACTIONS.md` current.** Whenever the owner does something by hand - a console or dashboard
change, a setting, a verification, a bug they spot - add a row (when, what, where, effect, how verified)
and tick off its "Still to do by hand" list. It is the record of their own contribution, as opposed to
the code Claude writes.

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
  public/css/site.css        layout and the Phase 4 design on top of USWDS (~625 lines)
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
cd api; python -m pytest -q                # 29 tests, no network
```
