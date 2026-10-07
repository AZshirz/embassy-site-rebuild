// Where the backend API lives. Set PUBLIC_API_URL at build time.
//
// Two shapes are supported:
//   absolute  https://xyz.run.app   - site and API are separate services (the Cloudflare/GCP build)
//   relative  /api                  - one domain serves both (the AWS build, via CloudFront)
// A relative path has no separate origin, so the Content-Security-Policy needs nothing beyond
// 'self' and the browser never makes a cross-origin request.
export const API_URL = (import.meta.env.PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const isAbsolute = /^https?:\/\//i.test(API_URL);
export const API_ORIGIN = isAbsolute ? new URL(API_URL).origin : '';

/** Extra CSP source for connect-src/form-action: empty when the API is same-origin. */
export const API_CSP_SOURCE = API_ORIGIN ? ` ${API_ORIGIN}` : '';
