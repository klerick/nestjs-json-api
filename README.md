<p align='center'>
  <a href="https://www.npmjs.com/package/json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/v/json-api-nestjs.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/l/json-api-nestjs.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/dm/json-api-nestjs.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/397d521f54660656f2fd6195ec482581/raw/coverage-json-api.json" alt="Coverage Badge" />
</p>

<p align="center">
  Json API plugin for 
  <a href="http://nestjs.com/" target="blank">NestJS</a>
  framework 
</p>
<p>
   Tools to implement JSON API, such as, end point, query params, body params, validation and transformation response.
</p>

## Description

<p>
This plugin works upon TypeOrm library, which is used as the main database abstraction layer tool. The module automatically generates an API according to JSON API specification from the database structure (TypeORM entities). It supports features such as requests validation based on database fields types, request filtering, endpoints extending, data relations control and much more. Our module significantly reduces the development time of REST services by removing the need to negotiate the mechanism of client-server interaction and implementing automatic API generation without the need to write any code.
</p>

## Installation

```bash
$ npm install
$ npm run typeorm:run
$ npm run seed:run
```

## Running the example app

```bash
# build plugin
$ npm run json-api-nestjs:build

# dev server
$ npm run example:serve

```

## Test

```bash
# unit tests
$ nx test json-api-nestjs

# test coverage
$ nx test json-api-nestjs --coverage
```

## License

The plugin is [MIT licensed](LICENSE).
