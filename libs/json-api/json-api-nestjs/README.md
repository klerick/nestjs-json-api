<p align='center'>
  <a href="https://www.npmjs.com/package/json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/v/json-api-nestjs.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/l/json-api-nestjs.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/dm/json-api-nestjs.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/397d521f54660656f2fd6195ec482581/raw/json-api-nestjs.json" alt="Coverage Badge" />
</p>

# json-api-nestjs

This plugin works upon TypeOrm library, which is used as the main database abstraction layer tool. The module
automatically generates an API according to JSON API specification from the database structure (TypeORM entities). It
supports features such as requests validation based on database fields types, request filtering, endpoints extending,
data relations control and much more. Our module significantly reduces the development time of REST services by removing
the need to negotiate the mechanism of client-server interaction and implementing automatic API generation without the
need to write any code.

## Installation

```bash  
$ npm install json-api-nestjs
```  

## Example

Once the installation process is complete, we can import the **JsonApiModule** into the root **AppModule**.

```typescript
import {Module} from '@nestjs/common';
import {JsonApiModule} from 'json-api-nestjs';
import {Users} from 'database';

@Module({
  imports: [
    JsonApiModule.forRoot({
      entities: [Users]
    }),
  ],
})
export class AppModule {
}
```

After this, you have to prepare CRUDs with ready-to-use endpoints:

- GET /users
- POST /users
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id
- GET /users/{id}/relationships/{relName}
- POST /users/{id}/relationships/{relName}
- PATCH /users/{id}/relationships/{relName}
- DELETE /users/{id}/relationships/{relName}

## Configuration params

The following interface is using for the configuration:

```typescript
export interface ModuleOptions {
  entities: Entity[]; // List of typeOrm Entity
  controllers?: NestController[];  // List of controller, if you need extend default present
  connectionName?: string; // Type orm connection name: "default" is default name  
  providers?: NestProvider[]; // List of addition provider for useing in custom controller
  imports?: NestImport[]; // List of addition module for useing in custom controller
  options?: {
    requiredSelectField?: boolean; // Need list of select field in get endpoint, try is default
    debug?: boolean; // Debug info in result object, like error message
    pipeForId?: Type<PipeTransform> // Nestjs pipe for validate id params, by default ParseIntPipe
    operationUrl?: string // Url for atomic operation https://jsonapi.org/ext/atomic/
  };
}
```

You can extend the default controller:

```typescript
import {Get, Param, Inject, BadRequestException} from '@nestjs/common';

import {Users} from 'database';
import {
  JsonApi,
  excludeMethod,
  JsonBaseController,
  InjectService,
  JsonApiService,
  ResourceObjectRelationships,
  Query,
} from 'json-api-nestjs';
import {ExampleService} from '../../service/example/example.service';

@JsonApi(Users, {
  allowMethod: excludeMethod(['deleteRelationship']),
  requiredSelectField: true,
  overrideRoute: 'user',
})
export class ExtendUserController extends JsonBaseController<Users> {
  @InjectService() public service: JsonApiService<Users>;
  @Inject(ExampleService) protected exampleService: ExampleService;

  public override getAll(query: Query<Users>): Promise<ResourceObject<Users, 'array'>> {
    if (!this.exampleService.someCheck(query)) {
      throw new BadRequestException({});
    }
    return this.service.getAll(query);// OR call parent method: super.getAll(query);
  }

  public override patchRelationship<Rel extends EntityRelation<Users>>(
    id: string | number,
    relName: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<Users, Rel>> {
    return super.patchRelationship(id, relName, input);
  }

  @Get(':id/example')
  testOne(@Param('id') id: string): string {
    return this.exampleService.testMethode(id);
  }
}
```

You can overwrite the default config for the current controller using options in the decorator **JsonAPi**.
Also you can specify an API method necessary for you, using **allowMethod**
Defulat validation check only simple type and database structure.
If you need custom pipe validation you can your owner pipe like this:

```typescript

import { Query } from '@nestjs/common';
import {
  JsonApi,
  excludeMethod,
  JsonBaseController,
  InjectService,
  JsonApiService,
  Query as QueryType,
} from 'json-api-nestjs';

@JsonApi(Users, {
  allowMethod: excludeMethod(['deleteRelationship']),
  requiredSelectField: true,
  overrideRoute: 'user',
})
export class ExtendUserController extends JsonBaseController<Users> {
  @InjectService() public service: JsonApiService<Users>;
  @Inject(ExampleService) protected exampleService: ExampleService;

  public override getAll(
    @Query(ExamplePipe) query: QueryType<Users>
  ): Promise<ResourceObject<Users, 'array'>> {
    return super.getAll(query);
  }
}
```

```typescript
import { ArgumentMetadata, PipeTransform } from '@nestjs/common';

import { Query } from 'json-api-nestjs';
import { Users } from 'database';

export class ExamplePipe implements PipeTransform<Query<Users>, Query<Users>> {
  transform(value: Query<Users>, metadata: ArgumentMetadata): Query<Users> {
    return value;
  }
}
```

## Swagger UI

For using swagger, you should only add [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction) and configure it
```typescript
const app = await NestFactory.create(AppModule);

const config = new DocumentBuilder()
  .setTitle('JSON API swagger example')
  .setDescription('The JSON API list example')
  .setVersion('1.0')
  .build();

SwaggerModule.setup(
  'swagger',
  app,
  () => SwaggerModule.createDocument(app, config), // !!!Important: document as factory
  {}
);

```

## Available endpoint method

Using **Users** entity and relation **Roles** entity as example

### List item of Users

  ```
  GET /users
  ```

Available query params:

- **include** - you can extend result with relations (aka join)
   ```
   GET /users?include=roles
   ```
  result of request will have role relation for each **Users** item

- **fields** - you can specify required fields of result query

  ```
   GET /users?fields[target]=login,lastName&fileds[roles]=name,key
   ```
  The "target" is **Users** entity
  The "roles" is **Roles** entity
  So, result of request will be have only fields  *login* and *lastName* for **Users** entity and fields *name* and *
  key* for **Roles** entity
- **sort** - you can sort result of the request

  ```
   GET /users?sort=target.name,-roles.key
   ```
  The "target" is **Users** entity
  The "roles" is **Roles** entity
  So, result of the request will be sorted by field *name* of **Users** by *ASC* and field *key* of **Roles** entity
  by **DESC**.
- **page** - pagination for you request

  ```
  GET /users?page[number]=1page[size]=20
  ```
- **filter** - filter for query

  ```
  GET /users?filter[name][eq]=1&filter[roles.name][ne]=test&filter[roles.status][eq]=true
  ```
  The "name" is a field of **Users** entity
  The "roles.name" is *name* field of **Roles** entity
  The "eq", "ne" is *[Filter operand](#filter-operand)*

  So, this query will be transformed like sql:
  ```sql
   WHERE users.name = 1 AND roles.name <> 'test' AND roles.status = true
  ```

## Filter operand

```typescript
type FilterOperand
{
in:string[] // is equal to the conditional of query "WHERE 'attribute_name' IN ('value1', 'value2')"
  nin: string[] // is equal to the conditional of query "WHERE 'attribute_name' NOT IN ('value1', 'value1')"
  eq: string // is equal to the conditional of query "WHERE 'attribute_name' = 'value1'
  ne: string // is equal to the conditional of query "WHERE 'attribute_name' <> 'value1'
  gte: string // is equal to the conditional of query "WHERE 'attribute_name' >= 'value1'
  gt: string // is equal to the conditional of query "WHERE 'attribute_name' > 'value1'
  lt: string // is equal to the conditional of query "WHERE 'attribute_name' < 'value1'
  lte:string // is equal to the conditional of query "WHERE 'attribute_name' <= 'value1'
  regexp: string // is equal to the conditional of query "WHERE 'attribute_name' ~* value1
  some: string // is equal to the conditional of query "WHERE 'attribute_name' && [value1]
}
```

### Get item of Users

  ```
  GET /users/:id
  ```
- **include** - you can extend result with relations (aka join)
   ```
   GET /users?include=roles
   ```
  result of request will have role relation for each **Users** item

- **fields** - you can specify required fields of result query

  ```
   GET /users?fields[target]=login,lastName&fileds[roles]=name,key
   ```
  The "target" is **Users** entity
  The "roles" is **Roles** entity
  So, result of request will be have only fields  *login* and *lastName* for **Users** entity and fields *name* and *
  key* for **Roles** entity

### Create item of Users
  ```
  POST /users
  ```

- **body** - Create new User and add link to address

```json
{
  "data": {
    "type": "users",
    "attributes": {
      "id": 0,
      "login": "string",
      "firstName": "string",
      "lastName": "string",
      "isActive": true,
      "createdAt": "2023-12-08T10:32:27.352Z",
      "updatedAt": "2023-12-08T10:32:27.352Z"
    },
    "relationships": {
      "addresses": {
        "id": "1",
        "type": "addresses"
      }
    }
  }
}
```
### Update item of Users
  ```
  PATCH /users/:id
  ```

- **body** - Update User with id 1 and update link to address and manager

```json
{
  "data": {
    "id": "1",
    "type": "users",
    "attributes": {
      "id": 0,
      "login": "string",
      "firstName": "string",
      "lastName": "string",
      "isActive": true,
      "createdAt": "2023-12-08T10:34:57.752Z",
      "updatedAt": "2023-12-08T10:34:57.752Z"
    },
    "relationships": {
      "addresses": {
        "id": "2",
        "type": "addresses"
      },
      "manager": {
        "id": "2",
        "type": "users"
      }
    }
  }
}

```

### Atomic operation
You can more information find [here](https://jsonapi.org/ext/atomic/)
But you have additinal feature.
For example: you will need create new **Roles**, then - create new **Users** and assign new **Roles** to new **Users**.
If use native json api you need send 3 http request:
- POST /roles
- POST /users

but [Atomic operation](https://jsonapi.org/ext/atomic/) allow for one request.
```json

{
   "atomic:operations":[
      {
         "op":"add",
         "ref":{
            "type":"roles",
            "tmpId":10000
         },
         "data":{
            "type":"roles",
            "attributes":{
               "name":"testRolesAgain",
               "key":"testRolesAgain"
            }
         }
      },
      {
         "op":"add",
         "ref":{
            "type":"users"
         },
         "data":{
            "type":"users",
            "attributes":{
               "login":"newLogin"
            },
            "relationships":{
               "addresses":{
                  "type":"addresses",
                  "id":"1"
               },
               "roles":[
                  {
                     "type":"roles",
                     "id":"10000"
                  }
               ]
            }
         }
      }
   ]
}

```
**tmpId** - is params for operation **add**, should be unique for all operations.

