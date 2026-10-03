// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.christoph-sens.com',
  trailingSlash: 'always',
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
    locales: ['de', 'en'],
    defaultLocale: 'de',
    routing: { prefixDefaultLocale: false },
  },
});
