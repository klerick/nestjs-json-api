# json-api-nestjs-sdk

The plugin of Angular for help work with JSON API over [json-api-nestjs](https://www.npmjs.com/package/json-api-nestjs)


## Installation

```bash $ 
npm install json-api-nestjs-sdk 
```

## Example

Once the installation process is complete, we can import the **JsonApiNestjsSdkModule** into the root **AppModule**.

```typescript  
import { Module } from '@nestjs/common';  
import { JsonApiNestjsSdkModule } from 'json-api-nestjs-sdk';  
import { BookList, Users, Roles, Comments, Addresses } from 'database';  
  
@Module({  
  imports: [  
    JsonApiNestjsSdkModule.forRoot(  
      {  
        apiPrefix: '/api/v1',  
        apiHost: window.location.origin,  
      },  
      { BookList, Users, Roles, Comments, Addresses }  
    ),  
  ],  
})  
export class AppModule {}
```


## Configuration params

The **JsonApiNestjsSdkModule.forRoot**  has two arguments: **JsonApiSdkConfig** and **ListEntities**

```typescript  
export interface JsonApiSdkConfig {  
  apiHost: string; // url for api, ex: http://localhost:3000  
  apiPrefix?: string; // prefix if exist, ex: /api/v1  
}
export interface ListEntities {  
    [key: string]: {  
        new (): any;  
    };  
} // Object with your entity  
```


## Example

```typescript
import { JsonApiSdkService } from 'json-api-nestjs-sdk';  
import { Users } from 'database';

export class AppComponent implements OnInit {  
  constructor(private jsonApiSdkService: JsonApiSdkService) {}  
  
  ngOnInit(): void {  
    this.jsonApiSdkService.getAll<Users>(  
      Users,  
      {  
        fields: {  
          target: ['login'],  
          addresses: ['city', 'state'],  
          comments: ['text', 'kind'],  
        },  
        filter: {  
          target: {  
            isActive: {  
              eq: 'true',  
            },  
          },  
        },  
        include: ['comments', 'addresses'],  
        page: {  
          size: 5,  
          number: 1,  
        },  
      },  
      true  
  );  
  }  
}
```

You can find more example [here](https://github.com/klerick/nestjs-json-api/blob/master/apps/example-angular-client/src/app/app.component.ts)

## Using with react, etc

```typescript
import { getInstance } from 'json-api-nestjs-sdk';
import { Users } from 'database';

const service = getInstance(
  {
    apiPrefix: '/api/v1',
    apiHost: window.location.origin,
  },
  {
    Users,
  }
);
```

You should add [linker plugin](https://angular.io/guide/creating-libraries#consuming-partial-ivy-code-outside-the-angular-cli) in your webpack config
You can find example webpack config [here](https://github.com/klerick/nestjs-json-api/blob/master/apps/example-react-client/webpack.config.ts)
