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
  // if (json.dependencies['@mikro-orm/postgresql']) {
  //   delete json.dependencies['@mikro-orm/postgresql'];
  // }
  // if (json.dependencies['@mikro-orm/sql-highlighter']){
  //   delete json.dependencies['@mikro-orm/sql-highlighter'];
  // }
  // if (json.dependencies['knex']){
  //   delete json.dependencies['knex'];
  // }

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

  for (const [name] of Object.entries(json.peerDependencies || {})) {
    if (!Object.keys(libsName).includes(name)) {
      continue;
    }
    try {
      const jsonDep = JSON.parse(
        readFileSync(
          join(workspaceRoot, 'dist', libsName[name], 'package.json')
        ).toString()
      );

      json.peerDependencies[name] = `^${jsonDep.version}`;
      for (const [name, version] of Object.entries(jsonDep.dependencies)) {
        if (json.dependencies[name]) {
          delete json.dependencies[name];
        }
      }
      for (const [name, version] of Object.entries(jsonDep.peerDependencies)) {
        if (json.peerDependencies[name]) {
          json.peerDependencies[name] = version;
        }
      }
    } catch (e) {
      console.warn(
        'Cant parse:',
        join(workspaceRoot, libsName[name], 'package.json')
      );
    }

  }

  for (const [name] of Object.entries(json.dependencies)) {
    if (!Object.keys(libsName).includes(name)) {
      continue;
    }
    try {
      const jsonDep = JSON.parse(
        readFileSync(
          join(workspaceRoot, 'dist', libsName[name], 'package.json')
        ).toString()
      );

      json.dependencies[name] = `^${jsonDep.version}`;
      for (const [name, version] of Object.entries(jsonDep.dependencies)) {
        if (json.dependencies[name]) {
          delete json.dependencies[name];
        }
      }
      for (const [name, version] of Object.entries(jsonDep.peerDependencies)) {
        if (json.peerDependencies[name]) {
          json.peerDependencies[name] = version;
        }
      }
    } catch (e) {
      console.warn(
        'Cant parse:',
        join(workspaceRoot, libsName[name], 'package.json')
      );
    }

  }
  // if (('peerDependencies' in json)) return;

  // json['peerDependencies'] = Object.entries(json['peerDependencies']).reduce(
  //   (acum, [name, value]) => {
  //     if (Object.keys(libsName).includes(name)) {
  //       acum[name] = `^${value}`;
  //     }
  //     return acum;
  //   },
  //   json['peerDependencies']
  // );
}
