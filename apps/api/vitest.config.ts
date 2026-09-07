import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
  resolve: {
    alias: { '@api': new URL('./src', import.meta.url).pathname },
  },
});
