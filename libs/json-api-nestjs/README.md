# json-api-nestjs

This plugin works upon TypeOrm library, which is used as the main database abstraction layer tool. The module automatically generates an API according to JSON API specification from the database structure (TypeORM entities). It supports features such as requests validation based on database fields types, request filtering, endpoints extending, data relations control and much more. Our module significantly reduces the development time of REST services by removing the need to negotiate the mechanism of client-server interaction and implementing automatic API generation without the need to write any code.

## Installation

```bash  
$ npm install json-api-nestjs
```  

## Example

Once the installation process is complete, we can import the **JsonApiModule** into the root **AppModule**.

```typescript
import { Module } from '@nestjs/common';
import { JsonApiModule } from 'json-api-nestjs';
import { Users } from 'database';

@Module({
  imports: [
    JsonApiModule.forRoot({  
	  entities: [Users]
	}),
  ],
})
export class AppModule {}
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
    options?: {  
	  requiredSelectField?: boolean; // Need list of select field in get endpoint, try is default
	  debug?: boolean; // Debug info in result object
    pipeForId?: Type<PipeTransform> // Nestjs pipe for validate id params, by default ParseIntPipe
	};  
}
```
You can extend the default controller:
```typescript
import { Get, Param, Inject, BadRequestException } from '@nestjs/common';  
  
import { Users } from 'database';  
import {  
  JsonApi,  
  excludeMethod,  
  JsonBaseController,  
  InjectService,  
  JsonApiService,  
  QueryParams,  
} from 'json-api-nestjs';  
import { ExampleService } from '../../service/example/example.service';  
  
@JsonApi(Users, {  
  allowMethod: excludeMethod(['deleteRelationship']),  
  requiredSelectField: true,  
})  
export class ExtendUserController extends JsonBaseController<Users> {  
  @InjectService() public service: JsonApiService<Users>;  
  @Inject(ExampleService) protected exampleService: ExampleService;  
  
  public override getAll(query: QueryParams<Users>) { 
	if (!this.exampleService.someCheck(query)) {
		throw new BadRequestException({});
	}
    return this.service.getAll({ query });  
  }  
  
  @Get(':id/example')  
  testOne(@Param('id') id: string): string {  
    return this.exampleService.testMethode(id);  
  }  
}
```

You can overwrite the default config for the current controller using options in the decorator **JsonAPi**.
Also you can specify an API method necessary for you, using **allowMethod**

## Swagger UI

For using swagger, you should only add [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)

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
  So, result of request will be have only fields  *login* and *lastName* for **Users** entity and fields *name* and *key* for **Roles** entity
- **sort** - you can sort result of the request
  
  ```
   GET /users?sort=target.name,-roles.key
   ```
  The "target" is **Users** entity
  The "roles" is **Roles** entity
  So, result of the request will be sorted by field *name* of **Users** by *ASC* and field *key* of **Roles** entity by **DESC**.
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

##  Filter operand

```typescript
type FilterOperand {
	in: string[] // is equal to the conditional of query "WHERE 'attribute_name' IN ('value1', 'value2')"
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

 
