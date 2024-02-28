<p align='center'>
  <a href="https://www.npmjs.com/package/json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/v/json-api-nestjs.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/l/json-api-nestjs.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/dm/json-api-nestjs.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/397d521f54660656f2fd6195ec482581/raw/coverage-json-api.json" alt="Coverage Badge" />
</p>

<p align="center">
  Json API plugins for 
  <a href="http://nestjs.com/" target="blank">NestJS</a>
  framework 
</p>
<p>
   Tools to implement JSON API, such as, end point, query params, body params, validation and transformation response.
</p>

- *[json-api-nestjs](https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs)* - plugin for create CRUD overs JSON API
- *[json-api-nestjs-sdk](https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs-sdk)* - tool for client, call api over *json-api-nestjs*
- *json-api-nestjs-acl* - tool for acl over *json-api-nestjs*(coming soon...)
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
