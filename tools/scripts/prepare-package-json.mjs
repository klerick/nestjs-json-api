import { readFileSync, writeFileSync } from 'fs';
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
  if (json.dependencies['@mikro-orm/postgresql']) {
    delete json.dependencies['@mikro-orm/postgresql'];
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
    .reduce((acum, i) => {
      acum[i.data.metadata.js.packageName] = i.data.root;
      return acum;
    }, {});

  for (const [name] of Object.entries(json.dependencies)) {
    if (!Object.keys(libsName).includes(name)) {
      continue;
    }
    try {
      const jsonDep = JSON.parse(
        readFileSync(
          join(workspaceRoot, libsName[name], 'package.json')
        ).toString()
      );
      json.dependencies[name] = jsonDep.version;
    } catch (e) {
      console.warn(
        'Can parse:',
        join(workspaceRoot, libsName[name], 'package.json')
      );
    }

    console.log(libsName[name]);
  }
  if (!('peerDependencies' in json)) return;

  json['peerDependencies'] = Object.entries(json['peerDependencies']).reduce(
    (acum, [name, value]) => {
      if (Object.keys(libsName).includes(name)) {
        acum[name] = `^${value}`;
      }
      return acum;
    },
    {}
  );
}
