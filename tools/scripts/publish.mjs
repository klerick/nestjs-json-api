/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

import devkit from '@nx/devkit';
const { readCachedProjectGraph, workspaceRoot } = devkit;

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

// Executing publish script: node path/to/publish.mjs {name} --version {version} --tag {tag}
// Default "tag" to "next" so we won't publish the "latest" tag by accident.
const [, , name, version, tag = 'next'] = process.argv;

// A simple SemVer validation to validate the version
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;
invariant(
  version && validVersion.test(version),
  `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${version}.`
);

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
const sharedProperty = [
  'license',
  'contributors',
  'repository',
  'engines',
  'private',
  'files',
];

// Updating the version in "package.json" before publishing
try {
  const mainJson = JSON.parse(
    readFileSync(join(workspaceRoot, 'package.json')).toString()
  );
  const json = JSON.parse(readFileSync(`package.json`).toString());
  json.version = version;

  for (const props of sharedProperty) {
    if (!mainJson[props] || json[props]) continue;
    json[props] = mainJson[props];
  }
  removeDepFromOtherLib(graph, name, json);
  writeFileSync(`package.json`, JSON.stringify(json, null, 2));
} catch (e) {
  console.log(e);
  console.error(`Error reading package.json file from library build output.`);
}

if (existsSync(join(workspaceRoot, outputPath, 'cjs', 'package.json'))) {
  unlinkSync(join(workspaceRoot, outputPath, 'cjs', 'package.json'));
}

if (existsSync(join(workspaceRoot, outputPath, 'mjs', 'package.json'))) {
  unlinkSync(join(workspaceRoot, outputPath, 'mjs', 'package.json'));
}

// Execute "npm publish" to publish
execSync(`npm publish --access public --tag ${tag}`);

function removeDepFromOtherLib(graph, name, json) {
  const libsName = Object.values(graph.nodes)
    .filter((i) => i.data.tags.includes('type:publish'))
    .map((i) => i.data.metadata.js.packageName);

  if (!('peerDependencies' in json)) return;

  json['peerDependencies'] = Object.entries(json['peerDependencies']).reduce(
    (acum, [name, value]) => {
      if (libsName.includes(name)) {
        acum[name] = `^${value}`;
      }
      return acum;
    },
    {}
  );
}
