// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://trueaffordapp.com',
  adapter: cloudflare(),
  i18n: {
    defaultLocale: 'en',
    locales: [
      'en',
      'es',
    ],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      // Error pages are deliberately noindexed and must not be advertised to crawlers.
      filter: (page) => !page.endsWith('/404'),
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          es: 'es',
        },
      },
    }),
  ],
});
