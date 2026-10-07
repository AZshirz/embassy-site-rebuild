// Writes dist/_headers from headers.template, filling in the API origin so the HTTP CSP allows
// the browser to call the backend. Runs as part of `npm run build`.
//
// Only the Cloudflare deployment consumes _headers. The AWS deployment sets the same headers
// through a CloudFront response-headers policy and serves the API same-origin, so PUBLIC_API_URL
// there is a relative path ("/api") and there is no extra CSP source to fill in.
import { readFileSync, writeFileSync } from 'node:fs';

const apiUrl = (process.env.PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const isAbsolute = /^https?:\/\//i.test(apiUrl);
const cspSource = isAbsolute ? ` ${new URL(apiUrl).origin}` : '';

const out = readFileSync('headers.template', 'utf8').replace(/ ?\{\{API_ORIGIN\}\}/g, cspSource);
writeFileSync('dist/_headers', out);
console.log('dist/_headers written; API CSP source:', cspSource.trim() || '(same-origin)');
