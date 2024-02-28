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
