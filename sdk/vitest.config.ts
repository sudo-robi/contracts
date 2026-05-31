import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    benchmark: {
      reporters: ['default', 'json'],
      outputJson: './bench/results.json',
      include: ['test/**/*.bench.ts'],
    },
    include: ['test/**/*.test.ts'],
  },
});
