# Ask the embassy

See the [README](../README.md#ask-the-embassy) for how it works, the results table and the safety
properties.

## Run the demo locally

```powershell
ollama pull llama3.1:8b                       # one time, ~4.9 GB; fits an 8 GB GPU

# terminal 1: the API with the assistant on
cd api
$env:OLLAMA_URL = "http://127.0.0.1:11434"; $env:SITE_URL = "http://localhost:4321"
uvicorn main:app --port 8000

# terminal 2: the site
cd site
npm run build; npx astro preview              # then open http://localhost:4321/ask/
```

## Two things the real model taught me

The fake-model tests couldn't see either:

- Without stop-word filtering every question matched every page (on "what", "is", "the"), so
  nothing was ever declined. Stop words are now removed per language.
- Plain word counts let the visa-tips page (which says "visa" twenty times) outrank the page with
  the visa phone number, so ranking now rewards matching more *different* question words and caps
  how much one repeated word can contribute.
