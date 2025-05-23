import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

import devkit from '@nx/devkit';
const { readCachedProjectGraph, workspaceRoot } = devkit;
const [, , name] = process.argv;
const graph = readCachedProjectGraph();
const project = graph.nodes[name];

const outputPath = project.data?.targets?.build?.options?.outputPath;
process.chdir(outputPath);
const sharedProperty = [
  'license',
  'contributors',
  'repository',
  'engines',
  'private',
  'files',
  'publishConfig',
];

try {
  const mainJson = JSON.parse(
    readFileSync(join(workspaceRoot, 'package.json')).toString()
  );
  const json = JSON.parse(readFileSync(`package.json`).toString());

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
