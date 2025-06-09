import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // switch to 'jsdom' when testing React components
    coverage: {
      reporter: ['text', 'html']
    },
    include: ['src/**/*.test.{ts,tsx}']
  }
});
