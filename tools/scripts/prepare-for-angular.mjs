import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';


const TEMP_FILE_PATH = 'libs/index.ts'
const ANGULAR_MODULE_PATH = 'tmp/angular-lib/json-api-nestjs-sdk/esm2022/json-api/json-api-nestjs-sdk/src/lib/json-api-angular.mjs'
const LIB_ANGULAR_MODULE_PATH = 'dist/libs/json-api/json-api-nestjs-sdk/mjs/src/lib/json-api-angular.js'
writeFileSync(
  TEMP_FILE_PATH,
  'export * from \'./json-api/json-api-nestjs-sdk/src/json-api-nestjs-sdk.module\';'
);

promisify(exec)(
  `nx run json-api-nestjs-sdk:compile-for-angular`
).then(r => {
  console.log(r)
  writeFileSync(LIB_ANGULAR_MODULE_PATH, readFileSync(ANGULAR_MODULE_PATH))
}).finally(() => {
  unlinkSync(TEMP_FILE_PATH)
})



