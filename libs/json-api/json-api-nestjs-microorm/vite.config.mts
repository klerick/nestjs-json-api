/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

import swc from 'unplugin-swc';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/json-api-nestjs-microorm',
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
    fileParallelism: false,
    pool: 'threads',
    singleThread: true,
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    maxWorkers: 1,
    minWorkers: 1,
    name: 'json-api-nestjs-microorm',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: [],
    reporters: ['default'],
    coverage: {
      enabled: true,
      reporter: ['json-summary'],
      reportsDirectory: '../../../coverage/libs/json-api/json-api-nestjs-microorm',
      provider: 'v8' as const,
    },
  },
}));
