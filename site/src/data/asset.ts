// Cache-buster for files Astro doesn't fingerprint (everything in public/ keeps the same name
// forever). v('/css/site.css') returns '/css/site.css?v=<short content hash>', so a changed file
// gets a new URL and an unchanged one still comes from cache.
// Appending a content hash does that: a changed file gets a new URL and is fetched, an unchanged
// one keeps its URL and is still served from cache. Read at build time, in Node, so there is no
// runtime cost and no extra request.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const cache = new Map<string, string>();

/** `/css/site.css` -> `/css/site.css?v=1a2b3c4d` */
export function v(publicPath: string): string {
  let versioned = cache.get(publicPath);
  if (versioned === undefined) {
    try {
      const bytes = readFileSync(`public${publicPath}`);
      versioned = `${publicPath}?v=${createHash('sha256').update(bytes).digest('hex').slice(0, 8)}`;
    } catch {
      // A missing file should not fail the build; fall back to the unversioned path.
      versioned = publicPath;
    }
    cache.set(publicPath, versioned);
  }
  return versioned;
}
