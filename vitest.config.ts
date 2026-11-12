import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    // Vitest blanks CSS imports by default; the theme test reads index.css as raw text.
    css: { include: [/src\/index\.css/] },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Node 25+ ships a native localStorage global that shadows jsdom's and
    // is non-functional without --localstorage-file. Disable it so tests
    // use jsdom's implementation on every Node version.
    execArgv: ['--no-experimental-webstorage'],
  },
});
