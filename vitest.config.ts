import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    poolOptions: {
      // Node 25+ ships a native localStorage global that shadows jsdom's and
      // is non-functional without --localstorage-file. Disable it so tests
      // use jsdom's implementation on every Node version.
      forks: { execArgv: ['--no-experimental-webstorage'] },
    },
  },
});
