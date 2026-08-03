import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // matrix-js-sdk ships ESM directory imports that Node's resolver rejects;
      // aliasing the entry and inlining lib/ lets Vite resolve them instead.
      'matrix-js-sdk/lib': path.resolve(import.meta.dirname, 'node_modules/matrix-js-sdk/lib'),
      'matrix-js-sdk': path.resolve(
        import.meta.dirname,
        'node_modules/matrix-js-sdk/lib/matrix.js'
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    server: {
      deps: {
        inline: [/matrix-js-sdk\/lib\//],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
    },
  },
});
