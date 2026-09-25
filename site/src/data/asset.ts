// Cache-busting version strings for assets served from public/ at stable paths.
//
// Nothing this build produces is fingerprinted. Astro hashes the assets it processes itself, but
// everything here is copied verbatim out of public/, so /css/site.css keeps that exact name for
// the life of the project. That is harmless while the server tells browsers to revalidate, and
// serious when it does not: the AWS deployment shipped these files with
// `Cache-Control: public,max-age=31536000,immutable`, which pins a stylesheet in every visitor's
// browser for a year and forbids even a reload from checking for a new one. A CloudFront
// invalidation clears the CDN, never a browser cache, so the fix has to change the URL.
//
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
