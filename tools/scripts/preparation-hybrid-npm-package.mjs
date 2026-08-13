import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { sep, join } from 'path';

import devkit from '@nx/devkit';
const { readCachedProjectGraph } = devkit;

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function readJson(type = 'mjs') {
  try {
    return JSON.parse(readFileSync(`${type}/package.json`).toString());
  } catch (e) {
    console.error(`Error reading package.json file from library build output.`);
  }
}

function addTypeToPath(path, type = 'mjs') {
  const [dot, ...other] = path.split(sep);
  return [dot, type, ...other].join(sep);
}

const [, , name] = process.argv;

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

invariant(
  project,
  `Could not find project "${name}" in the workspace. Is the project.json configured correctly?`
);

const outputPath = project.data?.targets?.build?.options?.outputPath;
invariant(
  outputPath,
  `Could not find "build.options.outputPath" of project "${name}". Is project.json configured  correctly?`
);
process.chdir(outputPath);

const angularModuleMap = {
  'nestjs-json-rpc-sdk': 'ngModule',
  'json-api-nestjs-sdk': 'ngModule',
};

const mjsJson = readJson();

const angularModule = angularModuleMap[name];
const angularModulePath = `./${angularModule}`;

const angularPath = mjsJson.exports[angularModulePath];

// tsc emits declarations only on the mjs side, so both subpaths take their
// types from there. The cjs half has the ngModule .js but no .d.ts.
const angularMjsPath = addTypeToPath(angularPath);
const angularCjsPath = addTypeToPath(angularPath, 'cjs');
const angularTypesPath = angularMjsPath.replace('.js', '.d.ts');

mjsJson.module = addTypeToPath(mjsJson.main);
mjsJson.main = addTypeToPath(mjsJson.main, 'cjs');
mjsJson.es2015 = mjsJson.module;
mjsJson.types = './mjs/src/index.d.ts';
// Both subpaths get the full condition set, matching json-api-nestjs-sdk --
// the sibling dual package, whose map is written by hand in its source
// manifest rather than generated here. Node resolves to cjs under require and
// under import alike; bundlers reach the ESM build through "module"/"default".
// The subpath used to be a bare string pointing at mjs only, which handed
// require() an ES module.
mjsJson.exports[angularModulePath] = {
  types: angularTypesPath,
  node: angularCjsPath,
  require: angularCjsPath,
  module: angularMjsPath,
  default: angularMjsPath,
};
mjsJson.exports['.'] = {
  types: mjsJson.types,
  node: mjsJson.main,
  require: mjsJson.main,
  module: mjsJson.es2015,
  default: mjsJson.es2015,
};
mjsJson.peerDependencies = {
  ...mjsJson.dependencies,
  ...mjsJson.peerDependencies,
};
// Kept for consumers still on node10 resolution, which ignores exports.
// Reads the precomputed path -- the subpath entry above is now an object.
mjsJson.typesVersions = {
  '*': {
    [angularModule]: [angularTypesPath],
  },
};
delete mjsJson.dependencies;

writeFileSync(`package.json`, JSON.stringify(mjsJson, null, 2));
writeFileSync('README.md', readFileSync(join('mjs', 'README.md').toString()));
writeFileSync('CHANGELOG.md', readFileSync(join('mjs', 'CHANGELOG.md').toString()));
try {
  unlinkSync(join('cjs', 'package.json'));
} catch (e) {}
try {
  unlinkSync(join('mjs', 'package.json'));
} catch (e) {}
try {
  unlinkSync(join('mjs', 'README.md'));
} catch (e) {}
try {
  unlinkSync(join('cjs', 'README.md'));
} catch (e) {}
try {
  unlinkSync(join('mjs', 'CHANGELOG.md'));
} catch (e) {}
try {
  unlinkSync(join('cjs', 'CHANGELOG.md'));
} catch (e) {}

// The root manifest stays CommonJS while the mjs directory declares itself as
// ESM -- the same layout the other dual packages assemble in their build target.
// Written after the cleanup above, which removes the manifest tsc emitted there.
// Dropping "type" from the root instead left Node guessing at the module kind of
// the mjs files: MODULE_TYPELESS_PACKAGE_JSON, then a reparse.
writeFileSync(join('mjs', 'package.json'), JSON.stringify({ type: 'module' }));
