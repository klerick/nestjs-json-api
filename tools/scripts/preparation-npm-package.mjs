import devkit from '@nx/devkit';

import {readdirSync, statSync, rmdirSync} from 'fs';
import {join} from 'path';

const { readCachedProjectGraph } = devkit;


function cleanEmptyFoldersRecursively(folder) {
  if (!statSync(folder).isDirectory()) return
  let files = readdirSync(folder);
  if (files.length > 0) {
    files.forEach((file) => cleanEmptyFoldersRecursively(join(folder, file)));

    // re-evaluate files; after deleting subfolder
    // we may have parent folder empty now
    files = readdirSync(folder);
  }

  if (files.length === 0) {
    console.log("removing: ", folder);
    rmdirSync(folder);
  }
}

const [, , name] = process.argv;

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

const outputPath = project.data?.targets?.build?.options?.outputPath;

process.chdir(outputPath);

cleanEmptyFoldersRecursively('./')
