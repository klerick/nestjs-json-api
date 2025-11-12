/* eslint-disable */
import { killPort, waitForPortOpen } from '@nx/node/utils';
import { logger, workspaceRoot } from '@nx/devkit';
import { spawn, execSync, ChildProcess } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

export async function setup() {
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
    logger.info(
      '\nRemove data folder "' +
        join(workspaceRoot, './tmp/pg-test/', target) +
        '"...\n'
    );
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

    execSync('npm run ' + target + ':seeder', {
      env: {
        ...process.env,
      },
      stdio: 'inherit',
    });

    logger.info('\nStarting server "' + target + '"...\n');

    const server = spawn('npx', ['nx', 'serve', 'json-api-server'], {
      env: {
        ...process.env,
        TYPE_ORM: target,
      },
      detached: true,
      stdio: 'ignore',
    });

    server.unref();

    // @ts-ignore
    globalThis.__SERVER_PROCESS__ = server;
    // @ts-ignore
    globalThis.__SERVER_PID__ = server.pid;
  } else {
    logger.info('\nRun from IDE\n');
  }
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await waitForPortOpen(port, { host });

  // @ts-ignore
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
}

export async function teardown() {
  const server = Reflect.get(globalThis, '__SERVER_PROCESS__');
  const serverPid = Reflect.get(globalThis, '__SERVER_PID__');
  const isNxRuner = !!process.env.NX_INVOKED_BY_RUNNER;
  if (isNxRuner) {
    // @ts-ignore
    if (server && server instanceof ChildProcess && serverPid) {
      try {
        server.kill('SIGTERM');
        logger.info(`Sent SIGTERM to process ${serverPid}`);

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
          process.kill(serverPid, 0);
          server.kill('SIGKILL');
          logger.info(`Sent SIGKILL to process ${serverPid}`);
        } catch (e) {
          logger.info(`Process ${serverPid} has been terminated`);
        }
      } catch (error) {
        logger.warn(`Failed to kill process: ${error}`);
      }
    }

    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    try {
      await killPort(port);
      logger.info(`Port ${port} has been freed`);
    } catch (error) {
      logger.warn(`Failed to kill port ${port}: ${error}`);
    }
  }

  // @ts-ignore
  logger.info(globalThis.__TEARDOWN_MESSAGE__);
}
