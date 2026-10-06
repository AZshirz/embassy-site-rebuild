// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // The canonical address for both deployments (canonical, hreflang and link-preview URLs).
  site: 'https://embassy-site-rebuild.ashirz.workers.dev',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'az'],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: 'directory' },
  // Astro 7 removes the whitespace between elements, which glued words to the links and badges
  // that follow them ("by email.Open the..."). Gzip makes the extra whitespace almost free.
  compressHTML: false,
});
