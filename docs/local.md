# Running it locally

## The site

```powershell
cd site
npm install            # also copies the USWDS files into public/uswds
npm run dev            # http://localhost:4321
```

## The build and the checks

```powershell
cd site
npm run build          # trims USWDS, builds the site, drops unused USWDS files, writes headers
npx astro preview      # then, from the repository root in another terminal:
python tools/audit.py --gate
node tools/lighthouse-gate.mjs http://localhost:4321/
node tools/lighthouse-gate.mjs --mobile --max-cls=0.1 http://localhost:4321/
```

`tools/audit.py` needs `pip install beautifulsoup4 lxml`. Commands work the same in PowerShell and
Git Bash.

## The API

```powershell
cd api
pip install -r requirements-dev.txt
python -m pytest -q                       # 31 tests, no network needed
uvicorn main:app --reload --port 8000     # then open http://localhost:8000/docs
```

The site's dev server talks to `http://localhost:8000` by default; set `PUBLIC_API_URL` in
`site/.env` or at the command line to point it elsewhere.

## Deploying

### Cloudflare

Cloudflare Workers Builds is wired to the repository through the dashboard. Any push to `main`
triggers a build; the build uses [`site/wrangler.jsonc`](../site/wrangler.jsonc) to serve the
contents of `site/dist/` as static assets and map unknown URLs to the 404 page. Nothing else to do.

### Cloud Run

1. Google Cloud → **Cloud Run → Deploy container → Continuously deploy from a repository**;
   connect this repository and choose [`api/Dockerfile`](../api/Dockerfile).
2. Allow unauthenticated access, **minimum instances 0**, **maximum instances 1**, and set
   `SITE_URL` to the site's address.
3. In Cloudflare, set the site's build variable `PUBLIC_API_URL` to the Cloud Run URL and redeploy.

### AWS

See [aws/README.md](../aws/README.md).
