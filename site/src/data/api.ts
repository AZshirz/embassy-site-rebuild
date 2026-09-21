// Where the backend API lives. Set PUBLIC_API_URL at build time (Cloudflare build variable);
// it defaults to a local uvicorn server for development.
export const API_URL = (import.meta.env.PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
export const API_ORIGIN = new URL(API_URL).origin;
