#!/usr/bin/env node

/**
 * Patch @suites/di.nestjs ESM build for native Node ESM resolution.
 *
 * Its ESM output imports '@nestjs/common/constants' without a file extension.
 * @nestjs/common ships no "exports" map, and native Node ESM does not resolve
 * extensionless subpaths, so `await import('@suites/di.nestjs')` throws
 * "Cannot find module .../@nestjs/common/constants". @suites/unit swallows that
 * failure and reports the misleading AdapterNotFoundError (ER020) instead.
 *
 * Vitest cannot work around this: @suites/unit loads the adapter through a
 * dynamic import with a computed specifier, so server.deps.inline does not
 * intercept it.
 *
 * Fixed in @suites/di.nestjs? Drop this script and the postinstall hook.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const esmDir = join(
  __dirname,
  '../..',
  'node_modules',
  '@suites/di.nestjs/dist/esm'
);

const targets = ['class-ctor-reflector.js', 'class-props-reflector.js'];
const BROKEN = "from '@nestjs/common/constants'";
const FIXED = "from '@nestjs/common/constants.js'";

if (!existsSync(esmDir)) {
  console.log('⏭️  @suites/di.nestjs ESM build not found, skipping patch');
  process.exit(0);
}

let patched = 0;

for (const file of targets) {
  const path = join(esmDir, file);
  if (!existsSync(path)) continue;

  const content = readFileSync(path, 'utf-8');
  if (!content.includes(BROKEN)) continue;

  writeFileSync(path, content.replaceAll(BROKEN, FIXED));
  console.log(`✅ Patched ${file}: added .js to '@nestjs/common/constants'`);
  patched++;
}

if (patched === 0) {
  console.log('⏭️  @suites/di.nestjs already patched');
}
