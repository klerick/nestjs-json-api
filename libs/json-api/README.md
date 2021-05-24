<p align="center">
  <a href="http://nestjs.com"><img src="https://nestjs.com/img/logo_text.svg" alt="Nest Logo" width="320" /></a>
</p>

<p align="center">
  A <a href="https://github.com/nestjs/nest">Nest</a> module that provides <a href="https://jsonapi.org/">JSONAPI</a> integration.
</p>
<p>
   Tools to implement JSON API, such as, end point, query params, body params, validation and transformation response using TypeORM entities.
</p>

## Description

<p>
This is the plugin that works upon TypeOrm library as a main database abstraction layer tool. Module automaticly generates API according to JSON API specificaton from the database structure (TypeORM entities). It support such features as requests validation based on database fields types, request filtering, endpoints exdending, data relations control and much more. Our module significantly reduces the development time of REST services by removing the need to negotiate the mechanism of client-server interaction and implementing automatic API generation without the need to write any code.
</p>

## Installation

```bash
npm install --save json-api-nestjs
```

## Reference Example

[example](https://github.com/ringcentral/nestjs-json-api/tree/master/apps/example) is an example project that demonstrates the usage of this module.

