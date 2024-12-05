import devkit from '@nx/devkit';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const { readCachedProjectGraph } = devkit;

const [, , name, angularName] = process.argv;

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

const outputPath = project.data?.targets?.build?.options?.outputPath;
const sourceRoot = project.data?.sourceRoot;

const packageJson = JSON.parse(
  readFileSync(`${outputPath}/package.json`).toString()
);
const angularFile = Object.keys(packageJson.exports)
  .filter((i) => !['./package.json', '.'].includes(i))
  .pop()
  .replace('./', '');
const [_, ...pathToModule] = sourceRoot.split('/');

const [nameSpace] = pathToModule;

const TEMP_FILE_PATH = 'libs/index.ts';
const ANGULAR_MODULE_PATH = `tmp/angular-lib/ngModule/esm2022/${nameSpace}/${name}/src/lib/${angularName}.mjs`;
const LIB_ANGULAR_MODULE_PATH = `${outputPath}/mjs/src/lib/${angularName}.js`;

writeFileSync(
  TEMP_FILE_PATH,
  `export * from './${pathToModule.join('/')}/${angularFile}';`
);

promisify(exec)(`nx run ${name}:compile-for-angular`)
  .then((r) => {
    writeFileSync(LIB_ANGULAR_MODULE_PATH, readFileSync(ANGULAR_MODULE_PATH));
  })
  .finally(() => {
    unlinkSync(TEMP_FILE_PATH);
  });
