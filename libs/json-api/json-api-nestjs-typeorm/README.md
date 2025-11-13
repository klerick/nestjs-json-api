<p align='center'>
  <a href="https://www.npmjs.com/package/@klerick/json-api-nestjs-typeorm" target="_blank"><img src="https://img.shields.io/npm/v/@klerick/json-api-nestjs-typeorm.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@klerick/json-api-nestjs-typeorm" target="_blank"><img src="https://img.shields.io/npm/l/@klerick/json-api-nestjs-typeorm.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@klerick/json-api-nestjs-typeorm" target="_blank"><img src="https://img.shields.io/npm/dm/@klerick/json-api-nestjs-typeorm.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/02a4c98cf7008fea2af70dc2d50f4cb7/raw/json-api-nestjs-microorm.json" alt="Coverage Badge" />
</p>

# json-api-nestjs-typeorm

TypeOrm adapter for **[json-api-nestjs](https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs)**

## Installation

```bash  
$ npm install @klerick/json-api-nestjs-typeorm
```  


## Configuration params

The following interface is using for the configuration:

```typescript
export type TypeOrmParam = {
  useSoftDelete?: boolean // Use soft delete
  runInTransaction?: <Func extends (...args: any) => any>(
    isolationLevel: IsolationLevel,
    fn: Func
  ) => ReturnType<Func> // You can use cutom function for wrapping transaction in atomic operation, example: runInTransaction from https://github.com/Aliheym/typeorm-transactional
};
```
