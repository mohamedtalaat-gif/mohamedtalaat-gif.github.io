import { defineConfig } from 'astro/config';

// User site: https://mohamedtalaat-gif.github.io/
export default defineConfig({
  site: 'https://mohamedtalaat-gif.github.io',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
