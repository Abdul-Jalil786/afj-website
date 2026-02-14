import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://www.afjltd.co.uk',
  server: { port: 5001 },
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/image-library'),
    }),
  ],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
