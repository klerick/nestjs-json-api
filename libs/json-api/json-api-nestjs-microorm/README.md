<p align='center'>
  <a href="https://www.npmjs.com/package/@klerick/json-api-nestjs-microorm" target="_blank"><img src="https://img.shields.io/npm/v/@klerick/json-api-nestjs-microorm.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@klerick/json-api-nestjs-microorm" target="_blank"><img src="https://img.shields.io/npm/l/@klerick/json-api-nestjs-microorm.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@klerick/json-api-nestjs-microorm" target="_blank"><img src="https://img.shields.io/npm/dm/@klerick/json-api-nestjs-microorm.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/02a4c98cf7008fea2af70dc2d50f4cb7/raw/json-api-nestjs-microorm.json" alt="Coverage Badge" />
</p>

# json-api-nestjs-microorm

MocroOrm adapter for **[json-api-nestjs](https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs)**

## Installation

```bash
$ npm install @klerick/json-api-nestjs-microorm
```

## Configuration params

The following interface is using for the configuration:

```typescript
export type MicroOrmParam = {
  arrayType?: string[]; //Custom type for indicate of array
};
```

## NOTE: MikroORM Default Named Context Issue in NestJS

[@mikro-orm/nestjs](https://github.com/mikro-orm/nestjs) does not create a [default named context](https://github.com/mikro-orm/nestjs/discussions/214).

As a result, the module initialization behaves differently depending on whether a single or multiple connections are used.
More specifically, the [dependency injection token for MikroORM differs](https://github.com/mikro-orm/nestjs/issues/213) between one and multiple database connections.

To maintain a consistent JSON:API module configuration across different database adapters,
I decided **not to add extra conditional checks** in the setup.

For everything to work correctly, @mikro-orm/nestjs should be integrated using the following module:
👉 [MicroORM Database Module](https://github.com/klerick/nestjs-json-api/blob/master/libs/microorm-database/src/lib/micro-orm-database.module.ts).

```typescript
import ormConfig from './config';

// need set contextName and registerRequestContext
export const config: Options = {
  contextName: 'default',
  registerRequestContext: false,
  ...ormConfig,
};

@Module({
  imports: [MikroOrmModule.forRoot(config), MikroOrmModule.forMiddleware()],
  exports: [MikroOrmCoreModule],
})
export class MicroOrmDatabaseModule {}
```
