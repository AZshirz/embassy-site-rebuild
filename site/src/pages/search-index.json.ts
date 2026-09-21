// Static endpoint: written to dist/search-index.json at build time. The API fetches this file.
import type { APIRoute } from 'astro';
import { buildSearchIndex } from '../data/searchIndex';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
