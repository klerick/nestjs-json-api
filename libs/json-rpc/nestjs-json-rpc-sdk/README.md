<p align='center'>
  <a href="https://www.npmjs.com/package/@klerick/nestjs-json-rpc-sdk" target="_blank"><img src="https://img.shields.io/npm/v/@klerick/nestjs-json-rpc-sdk.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@klerick/nestjs-json-rpc-sdk" target="_blank"><img src="https://img.shields.io/npm/l/@klerick/nestjs-json-rpc-sdk.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@klerick/nestjs-json-rpc-sdk" target="_blank"><img src="https://img.shields.io/npm/dm/@klerick/nestjs-json-rpc-sdk.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/02a4c98cf7008fea2af70dc2d50f4cb7/raw/nestjs-json-rpc-sdk.json" alt="Coverage Badge" />
</p>

# nestjs-json-rpc-sdk

The plugin of client for help work with JSON-ROC over [nestjs-json-rpc](https://www.npmjs.com/package/@klerick/nestjs-json-rpc)
Work with RPC look like call function

## Installation

```bash $ 
npm install @klerick/nestjs-json-rpc-sdk
```

## Example

Once the installation process is complete, we can import the **RpcFactory**.
For example, we have RPC server which have service which implement this interface: 

```typescript
export type InputType = {
  a: number;
  b: number;
};

export type OutputType = {
  c: string;
  d: string;
};

export interface RpcService {
  someMethod(firstArg: number): Promise<number>;
  someOtherMethod(firstArg: number, secondArgument: number): Promise<string>;
  methodWithObjectParams(a: InputType): Promise<OutputType>;
}
```

```typescript 
import {
  RpcFactory,
} from '@klerick/nestjs-json-rpc-sdk';
const { rpc, rpcBatch } = RpcFactory(
  {
    rpcHost: `http://localhost:${port}`,
    rpcPath: `/api/rpc`,
    transport: TransportType.HTTP,
  },
  false
);

rpc.RpcService.someMethod(1).sibcribe(r => console.log(r))

const call1 = rpcForBatch.RpcService.someMethod(1);
const call2 = rpcForBatch.RpcService.methodWithObjectParams({
  a: 1,
  b: 2,
});

rpcBatch(call1, call2).sibcribe(([result1, result2]) => console.log(result1, result2))

```
That's all:)

You can use typescript for type checking:
```typescript 
import {
  RpcFactory,
} from '@klerick/nestjs-json-rpc-sdk';



type MapperRpc = {
  RpcService: RpcService;
};

const { rpc, rpcBatch } = RpcFactory<MapperRpc>(
  {
    rpcHost: `http://localhost:${port}`,
    rpcPath: `/api/rpc`,
    transport: TransportType.HTTP,
  },
  false
);
//TS2345: Argument of type string is not assignable to parameter of type number
const call = rpc.RpcService.someMethod('inccorectParam');
//TS2339: Property IncorrectService does not exist on type MapperRpc
const call2 = rpc.IncorrectService.someMethod(1);
//TS2339: Property incorrectMethod does not exist on type RpcService
const call3 = rpc.RpcService.incorrectMethod(1);

```


By default, HTTP transport using fetch, but you can set other:

```typescript 
import axios from 'axios';
import {
  RpcFactory,
  axiosTransportFactory,
} from '@klerick/nestjs-json-rpc-sdk';

const { rpc, rpcBatch } = RpcFactory<MapperRpc>(
  {
    rpcHost: `http://localhost:4200`,
    rpcPath: `/api/rpc`,
    transport: TransportType.HTTP,
    httpAgentFactory: axiosTransportFactory(axios),
  },
  false
);
```
Or you can implement your personal factory.

You should implement **HttpAgentFactory** type

```typescript

type Transport<T extends LoopFunc> = (
  body: PayloadRpc<T>
) => Observable<RpcResult<T>>;

type HttpAgentFactory<T extends LoopFunc> = (
  url: string
) => Transport<T>;
```



if you want to use **Promise** instead of **Observer** 

***!!!!***: - you need to use another object for prepare rpc batch call 
```typescript 
import axios from 'axios';
import {
  RpcFactory,
  axiosTransportFactory,
} from '@klerick/nestjs-json-rpc-sdk';

const { rpc, rpcBatch, rpcForBatch } = RpcFactory<MapperRpc>(
  {
    rpcHost: `http://localhost:4200`,
    rpcPath: `/api/rpc`,
    transport: TransportType.HTTP,
    httpAgentFactory: axiosTransportFactory(axios),
  },
  true // need true for use promise as result
);
const result = await rpc.RpcService.someMethod(1)

const call1 = rpcForBatch.RpcService.someMethod(1);
const call2 = rpcForBatch.RpcService.methodWithObjectParams({
  a: 1,
  b: 2,
});

const [result1, result2] = await rpcBatch(call1, call2);
```

For use **WebSocket**
```typescript 
import {
  RpcFactory,
} from '@klerick/nestjs-json-rpc-sdk';
import { WebSocket as ws } from 'ws';
import { webSocket } from 'rxjs/webSocket';

const someUrl = 'ws://localhost:4200/rpc'
const destroySubject = new Subject<boolean>();
const nativeSocketInstance = webSocket<any>(destroySubject);

const { rpc, rpcBatch } = RpcFactory<MapperRpc>(
  {
    transport: TransportType.WS,
    useWsNativeSocket: true, // - Will be use native WebSocket
    //nativeSocketImplementation: ws, - if you use NodeJS you can use other implementation
    rpcHost: `http://localhost:4200`,
    rpcPath: `/rpc`,
    destroySubject, // - If you need close connection you need call destroySubject.next(true),
    //nativeSocketInstance - you can use your owner socket instance
  },
  false
);
```
You can use **socket.io**
```typescript 
import {
  RpcFactory,
} from '@klerick/nestjs-json-rpc-sdk';

import { io } from 'socket.io-client';

const someUrl = 'ws://localhost:4200'
const destroySubject = new Subject<boolean>();
const ioSocketInstance = io(someUrl, { path: '/rpc' })
const { rpc, rpcBatch } = RpcFactory<MapperRpc>(
  {
    transport: TransportType.WS,
    useWsNativeSocket: false, // - Will be use socket.io
    destroySubject, // - If you need close connection you need call destroySubject.next(true),
    ioSocketInstance
  },
  false
);
```

You can use Angular module:

```typescript 

import {
  JsonRpcAngular,
  JsonRpcAngularConfig,
  TransportType,
} from '@klerick/nestjs-json-rpc-sdk/ngModule'
import { Subject } from 'rxjs';
import { io } from 'socket.io-client';
import {
  JSON_RPC,
  RPC_BATCH,
  Rpc,
} from '@klerick/nestjs-json-rpc-sdk/json-rpc-sdk.module';

@Component({
  standalone: true,
  selector: 'nestjs-json-api-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private rpc = inject<Rpc<MapperRpc>>(JSON_RPC);
  private rpcBatch = inject(RPC_BATCH);
}

const destroySubjectToken = new InjectionToken('destroySubjectToken', {
  factory: () => new Subject<boolean>(),
});

const tokenSocketInst = new InjectionToken('tokenSocketInst', {
  factory: () => webSocket('ws://localhost:4200/rpc'),
});
const tokenIoSocketInst = new InjectionToken('tokenIoSocketInst', {
  factory: () => io('http://localhost:4200', { path: '/rpc' }),
});

const httpConfig: JsonRpcAngularConfig = {
  transport: TransportType.HTTP,
  rpcPath: '/api/rpc',
  rpcHost: 'http://localhost:4200',
};
const wsConfig: JsonRpcAngularConfig = {
  transport: TransportType.WS,
  useWsNativeSocket: true,
  rpcPath: 'rpc',
  rpcHost: 'ws://localhost:4200',
  destroySubjectToken,
};
const wsConfigWithToken: JsonRpcAngularConfig = {
  transport: TransportType.WS,
  useWsNativeSocket: true,
  tokenSocketInst,
  destroySubjectToken,
};
const ioConfig: JsonRpcAngularConfig = {
  transport: TransportType.WS,
  useWsNativeSocket: false,
  destroySubjectToken,
  tokenSocketInst: tokenIoSocketInst,
};

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      JsonRpcAngular.forRoot(httpConfig)
    ),
  ],
}).catch((err) =>
  console.error(err)
);

```


