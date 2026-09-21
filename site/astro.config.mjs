// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Adjust `site` to the final hosting URL before deploying (used for canonical + hreflang links)
  site: 'https://embassy-site-rebuild.sneakywun58.workers.dev',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'az'],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: 'directory' },
});
