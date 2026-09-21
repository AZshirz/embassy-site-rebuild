// Writes dist/_headers from headers.template, filling in the API origin so the HTTP CSP allows
// the browser to call the backend. Runs as part of `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs';

const apiUrl = (process.env.PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const origin = new URL(apiUrl).origin;
const out = readFileSync('headers.template', 'utf8').replace(/\{\{API_ORIGIN\}\}/g, origin);
writeFileSync('dist/_headers', out);
console.log('dist/_headers written with API origin', origin);
