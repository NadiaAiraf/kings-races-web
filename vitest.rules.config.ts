import { defineConfig } from 'vitest/config';

// Security rules tests run against the Firestore emulator. Use
// `npm run test:rules`, which starts the emulator around this config.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rules/**/*.test.ts'],
    fileParallelism: false,
  },
});
