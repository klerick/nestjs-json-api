/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

import swc from 'unplugin-swc';
import { defineConfig } from 'vite';
import { BaseSequencer } from 'vitest/node';

class CustomSequencer extends BaseSequencer {
  async sort(files: any[]) {
    return [...files].sort((a, b) => {
      // Vitest 4: files are TestSpecification objects with moduleId property
      const pathA = typeof a === 'string' ? a : (a.moduleId ?? a[1] ?? '');
      const pathB = typeof b === 'string' ? b : (b.moduleId ?? b[1] ?? '');
      return pathA.localeCompare(pathB);
    });
  }
}

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/json-api-server-e2e',
  plugins: [
    nxViteTsPaths(),
    swc.vite({
      module: { type: 'es6' },
      tsconfigFile: './tsconfig.spec.json',
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
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
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
    pool: 'forks',
    maxWorkers: 1,
    sequence: {
      sequencer: CustomSequencer,
      concurrent: false,
      shuffle: false,
    },
    maxConcurrency: 1,
    env: {
      VITEST: 'true',
      NODE_ENV: 'test',
    },
  },
}));
