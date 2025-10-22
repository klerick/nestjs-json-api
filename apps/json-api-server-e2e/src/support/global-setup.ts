/* eslint-disable */
import { waitForPortOpen } from '@nx/node/utils';
import {logger, workspaceRoot } from '@nx/devkit'
import { spawn, execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';


export default async function() {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).

  const isNxRuner = !!process.env.NX_INVOKED_BY_RUNNER;

  logger.info('\nSetting up...\n');
  if (isNxRuner) {
    let target: 'microorm' | 'typeorm';
    switch (process.env.NX_TASK_TARGET_TARGET) {
      case 'e2e-micro':
        target = 'microorm';
        break;
      case 'e2e':
        target = 'typeorm';
        break;
      default:
        throw new Error('Unknown target');
    }

    logger.info('\nRuning migration for "' + target + '"...\n');
    rmSync(join(workspaceRoot, './tmp/pg-test/', target), {
      recursive: true,
      force: true,
    });
    execSync('npm run ' + target + ':up', {
      env: {
        ...process.env,
      },
      stdio: 'inherit',
    });

    logger.info('\nStarting server "' + target + '"...\n');

    const server = spawn(
      'TYPE_ORM=' + target,
      ['npx', 'nx', 'serve', 'json-api-server'],
      {
        shell: true,
        stdio: 'pipe',
      }
    );
    globalThis.__SERVER_PROCESS__ = server;
  } else {
    logger.info('\nRun from IDE\n');
  }
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await waitForPortOpen(port, { host });



  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
}

