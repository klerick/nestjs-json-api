<p align="center">
<a href="http://nestjs.com/" target="blank">NestJS</a> JSON API & JSON RPC Suite
</p>

<p>
   This monorepo contains a set of several libraries designed to simplify the development of server and client applications using NestJS. These tools help you work with two popular protocols:
</p>


- **[JSON:API](https://jsonapi.org/)** – A specification for building RESTful APIs with standardized request and response formats.
 
 > **[json-api-nestjs](https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs)** - This package enables you to quickly set up a server API that adheres to the JSON:API specification, handling standard CRUD operations for your resources.</br> 
 > **[json-api-nestjs-sdk](https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs-sdk)** - tool for client, call api over *json-api-nestjs* 


- **[JSON-RPC](https://www.jsonrpc.org/)** – A protocol for remote procedure calls using JSON.

> **[nestjs-json-rpc](https://github.com/klerick/nestjs-json-api/tree/master/libs/json-rpc/nestjs-json-rpc)** - Use this package to implement remote procedure call (RPC) functionality in your NestJS applications, enabling efficient inter-service communication.</br>
> **[nestjs-json-rpc-sdk](https://github.com/klerick/nestjs-json-api/tree/master/libs/json-rpc/nestjs-json-rpc-sdk)** - This tool offers a straightforward way to call remote procedures from your client-side code, ensuring smooth communication with your JSON-RPC server.

- **ACL tools** - tool for acl over *json-api-nestjs*(coming soon...)
## Installation

```bash
$ npm install
$ npm run typeorm:run
$ npm run seed:run
```

## Running the example app

```bash
# dev server
$ nx run json-api-server:serve:development

```
## License

The plugin is [MIT licensed](LICENSE).
