import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import { readFileSync } from 'node:fs';

// Load redirect map from seo/redirects.json
const redirectData = JSON.parse(readFileSync('./seo/redirects.json', 'utf-8'));
const redirects = {};
for (const section of ['pages', 'blog_posts', 'wordpress_patterns', 'misc_artifacts']) {
  if (redirectData[section]) {
    for (const [from, to] of Object.entries(redirectData[section])) {
      redirects[from] = { status: 301, destination: to };
    }
  }
}

export default defineConfig({
  site: 'https://www.afjltd.co.uk',
  server: { port: 5001 },
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  redirects,
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/image-library') && !page.includes('/content-calendar') && !page.includes('/admin'),
    }),
  ],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
