#!/usr/bin/env node

/**
 * Patch @suites/doubles.vitest for Vitest 4.x compatibility
 * 1. Adds missing .js extensions in ESM imports
 * 2. Fixes read-only property assignment in Proxy handler (lastCall is getter-only in Vitest 4)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseDir = join(__dirname, '../..', 'node_modules', '@suites/doubles.vitest/dist/esm');
const indexPath = join(baseDir, 'index.js');
const mockStaticPath = join(baseDir, 'mock.static.js');

if (!existsSync(indexPath)) {
  console.log('⏭️  @suites/doubles.vitest not found, skipping patch');
  process.exit(0);
}

let patched = false;

// Patch 1: Fix ESM imports in index.js
let indexContent = readFileSync(indexPath, 'utf-8');
if (!indexContent.includes("from './mock.static.js'")) {
  indexContent = indexContent.replaceAll("from './mock.static'", "from './mock.static.js'");
  writeFileSync(indexPath, indexContent);
  console.log('✅ Patched index.js: added .js extension');
  patched = true;
}

// Patch 2: Fix read-only property assignment in mock.static.js
if (existsSync(mockStaticPath)) {
  let mockContent = readFileSync(mockStaticPath, 'utf-8');

  // Check if already patched
  if (mockContent.includes('Skip non-writable, non-configurable properties')) {
    // Already patched
  } else {
    // Patch the overrideMockImp function
    const oldOverride = `const overrideMockImp = (obj) => {
    const proxy = new Proxy(obj, handler());
    for (const name of Object.keys(obj)) {
        if (typeof obj[name] === 'object' && obj[name] !== null) {
            proxy[name] = overrideMockImp(obj[name]);
        }
        else {
            proxy[name] = obj[name];
        }
    }
    return proxy;
};`;

    const newOverride = `const overrideMockImp = (obj) => {
    const proxy = new Proxy(obj, handler());
    for (const name of Object.keys(obj)) {
        // Skip non-writable, non-configurable properties (Vitest 4.x compatibility)
        const desc = Object.getOwnPropertyDescriptor(obj, name);
        if (desc && !desc.writable && !desc.configurable) {
            continue;
        }
        if (typeof obj[name] === 'object' && obj[name] !== null) {
            proxy[name] = overrideMockImp(obj[name]);
        }
        else {
            proxy[name] = obj[name];
        }
    }
    return proxy;
};`;

    const oldSetHandler = `set: (obj, property, value) => {
        obj[property] = value;
        return true;
    }`;

    const newSetHandler = `set: (obj, property, value) => {
        const desc = Object.getOwnPropertyDescriptor(obj, property);
        if (desc) {
            if (desc.set) {
                desc.set.call(obj, value);
                return true;
            }
            if (!desc.writable) {
                return !desc.configurable ? (obj[property] === value) : true;
            }
        }
        try {
            obj[property] = value;
        } catch (e) {
            // Ignore assignment errors for read-only properties
        }
        return true;
    }`;

    if (mockContent.includes(oldOverride)) {
      mockContent = mockContent.replace(oldOverride, newOverride);
      patched = true;
    }

    if (mockContent.includes(oldSetHandler)) {
      mockContent = mockContent.replace(oldSetHandler, newSetHandler);
      patched = true;
    }

    if (patched) {
      writeFileSync(mockStaticPath, mockContent);
      console.log('✅ Patched mock.static.js: fixed read-only property handling for Vitest 4.x');
    }
  }
}

if (!patched) {
  console.log('⏭️  @suites/doubles.vitest already patched');
}
