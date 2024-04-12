import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import {sep, join} from 'path'

import devkit from '@nx/devkit';
const { readCachedProjectGraph } = devkit;

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function readJson(type = 'mjs'){
  try {
    return JSON.parse(readFileSync(`${type}/package.json`).toString());
  } catch (e) {
    console.error(`Error reading package.json file from library build output.`);
  }
}

function addTypeToPath(path, type = 'mjs'){
  const [dot, ...other] = path.split(sep)
  return [
    dot,
    type,
    ...other
  ].join(sep)
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
  'nestjs-json-rpc-sdk': 'json-rpc-sdk.module',
  'json-api-nestjs-sdk': 'json-api-nestjs-sdk.module'
}

const mjsJson = readJson();
const angularModule = angularModuleMap[name];
const angularModulePath = `./${angularModule}`;

const angularPath = mjsJson.exports[angularModulePath]

mjsJson.module = addTypeToPath(mjsJson.main)
mjsJson.main = addTypeToPath(mjsJson.main, 'cjs')
mjsJson.es2015 = mjsJson.module
mjsJson.types = "./mjs/src/index.d.ts";
mjsJson.exports[angularModulePath] = addTypeToPath(angularPath)
mjsJson.exports['.'] = {
  types: mjsJson.types,
  node: mjsJson.main,
  require: mjsJson.main,
  es2015: mjsJson.es2015,
  default: mjsJson.es2015,
}
mjsJson.peerDependencies = {
  ...mjsJson.dependencies,
  ...mjsJson.peerDependencies
}
mjsJson.typesVersions = {
  "*": {
    [angularModule]: [
      mjsJson.exports[angularModulePath].replace('.js', '.d.ts')
    ]
  }
}
delete mjsJson.type
delete mjsJson.dependencies

writeFileSync(`package.json`, JSON.stringify(mjsJson, null, 2));
writeFileSync(
  'README.md',
  readFileSync(join('mjs', 'README.md').toString()),
)
try {
  unlinkSync(join('cjs', 'package.json'))

} catch (e) {

}
try {
  unlinkSync(join('mjs', 'package.json'))
} catch (e) {

}
try {
  unlinkSync(join('mjs', 'README.md'))
} catch (e) {

}
try {
  unlinkSync(join('cjs', 'README.md'))
} catch (e) {

}
