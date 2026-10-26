import { defineConfig } from 'vitest/config'

/**
 * Integration suite that talks to the real Firebase SDKs running against the
 * local emulators. Start it with `npm run test:emulator`; the default
 * `npm run test:run` excludes these files because they need the emulators.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.emulator.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
})
