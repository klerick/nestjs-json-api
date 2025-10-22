/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

import swc from 'unplugin-swc';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/json-api-server-e2e',
  plugins: [
    nxViteTsPaths(),
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
        keepClassNames: true,
        externalHelpers: true,
        loose: true,
      },
    }),
  ],
  test: {
    name: 'json-api-server-e2e',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/support/test-setup.ts'],
    globalSetup: ['src/support/global-setup.ts'],
    globalTeardown: ['src/support/global-teardown.ts'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      reporter: ['json'],
      reportsDirectory: '../../coverage/json-api-server-e2e',
      provider: 'v8' as const,
    },
    fileParallelism: false,
    pool: 'threads',
    singleThread: true,
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    maxWorkers: 1,
    minWorkers: 1,
    env: {
      VITEST: 'true',
      NODE_ENV: 'test',
    },
  },
}));
