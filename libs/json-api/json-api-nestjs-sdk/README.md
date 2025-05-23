
<p align='center'>
  <a href="https://www.npmjs.com/package/json-api-nestjs-sdk" target="_blank"><img src="https://img.shields.io/npm/v/json-api-nestjs-sdk.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/json-api-nestjs-sdk" target="_blank"><img src="https://img.shields.io/npm/l/json-api-nestjs-sdk.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/json-api-nestjs-sdk" target="_blank"><img src="https://img.shields.io/npm/dm/json-api-nestjs-sdk.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/02a4c98cf7008fea2af70dc2d50f4cb7/raw/json-api-nestjs-sdk.json" alt="Coverage Badge" />
</p>

# json-api-nestjs-sdk

The plugin of client for help work with JSON API over [json-api-nestjs](https://www.npmjs.com/package/json-api-nestjs)


## Installation

```bash $ 
npm install @klerick/json-api-nestjs-sdk 
```

## Example

Once the installation process is complete, we can import the **JsonApiJs**.

```typescript  
import {
  adapterForAxios,
  FilterOperand,
  JsonApiJs,
  JsonSdkPromise,
} from '@klerick/json-api-nestjs-sdk';
import { faker } from '@faker-js/faker';
import axios from 'axios';

import {Users} from 'database'

const axiosAdapter = adapterForAxios(axios);

const jsonConfig: JsonConfig = {
  adapter: axiosAdapter,
  apiHost: 'http://localhost:3000',
  apiPrefix: 'api',
  dateFields: ['createdAt', 'updatedAt'],
  operationUrl: 'operation',
}

const jsonSdk = JsonApiJs(
  jsonConfig,
  true //by default all methods return Observable but you return promise
);

await jsonSdk.jonApiSdkService.getAll(Users, {
  filter: {
    target: {
      id: { [FilterOperand.in]: usersId.map((i) => `${i}`) },
    },
  },
  include: ['addresses', 'comments', 'roles', 'manager'],
});


// Atomic Operation

const address = new Addresses();

address.city = faker.string.alpha(50);
address.state = faker.string.alpha(50);
address.country = faker.string.alpha(50);
address.id = 10000;

const manager = getUser();
manager.id = 10001;
manager.addresses = address;

const roles = new Roles();
roles.id = 10002;
roles.name = faker.string.alpha(50);
roles.key = faker.string.alpha(50);

const user = getUser();
user.addresses = address;
user.manager = manager;
user.roles = [roles];

const [addressPost, managerPost, rolesPost, userPost] = await jsonSdk
  .atomicFactory()
  .postOne(address)
  .postOne(manager)
  .postOne(roles)
  .postOne(user)
  .run();


```
or you can use Angular module:
```typescript
import { 
  provideJsonApi, 
  AtomicFactory, 
  JsonApiSdkService 
} from '@klerick/json-api-nestjs-sdk/ngModule';
import {
  provideHttpClient,
  withFetch,
} from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'nestjs-json-api-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private JsonApiSdkService = inject(JsonApiSdkService);
  private atomicFactory = inject(AtomicFactory);
}

const angularConfig: JsonSdkConfig = {
  apiHost: 'http://localhost:4200',
  idKey: 'id',
  apiPrefix: 'api',
  operationUrl: 'operation',
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideJsonApi(angularConfig)
  ],
}).catch((err) =>
  console.error(err)
);



```

## Configuration params

```typescript  
type JsonSdkConfig = {
  apiHost: string; // url for api
  apiPrefix?: string; // prefex for api - api/v1/....
  idKey?: string; // name for id field
  idIsNumber?: boolean; // use parseInt for id field
  operationUrl?: string; // url for atomic operation
  dateFields: string[] // array of dateField for create date object - ;
}  

type JsonConfig = JsonSdkConfig & {
  adapter?: HttpInnerClient; // by default use fetch for http request but you can change it
}
```
* You can see interface of [HttpInnerClient](https://github.com/klerick/nestjs-json-api/blob/master/libs/json-api/json-api-nestjs-sdk/src/lib/types/http-inner-client.ts)
* More example you can see [here](https://github.com/klerick/nestjs-json-api/blob/master/apps/json-api-server-e2e/src/json-api/json-api-sdk) or [here](https://github.com/klerick/nestjs-json-api/blob/master/apps/json-api-front/src/app/app.component.ts)
