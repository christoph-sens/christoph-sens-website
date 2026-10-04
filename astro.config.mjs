// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.christoph-sens.com',
  trailingSlash: 'always',
  // hreflang alternates live in each page's <head> (BaseLayout); the sitemap's i18n option only
  // pairs identical paths and would miss translated slugs like /services/ ↔ /de/leistungen/.
  integrations: [sitemap()],
  vite: {
    build: {
      // Emit every asset (e.g. small font subsets) as a file instead of a data: URI, so the
      // Content-Security-Policy in public/_headers can stay at font-src/img-src 'self'.
      assetsInlineLimit: 0,
    },
  },
  markdown: {
    // Shiki highlights with inline style attributes, which the CSP (style-src 'self') blocks.
    syntaxHighlight: false,
  },
  i18n: {
    locales: ['en', 'de', 'es'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
});
