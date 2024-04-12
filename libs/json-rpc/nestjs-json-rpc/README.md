<p align='center'>
  <a href="https://www.npmjs.com/package/@klerick/nestjs-json-rpc" target="_blank"><img src="https://img.shields.io/npm/v/@klerick/nestjs-json-rpc.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@klerick/nestjs-json-rpc" target="_blank"><img src="https://img.shields.io/npm/l/@klerick/nestjs-json-rpc.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@klerick/nestjs-json-rpc" target="_blank"><img src="https://img.shields.io/npm/dm/@klerick/nestjs-json-rpc.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/02a4c98cf7008fea2af70dc2d50f4cb7/raw/nestjs-json-rpc.json" alt="Coverage Badge" />
</p>

# nestjs-json-rpc

This plugin allow to create RPC server using [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification). 
Now, You can use HTTP or WebSocket as transport protocol.

## Installation

```bash  
$ npm install @klerick/nestjs-json-rpc
```  
## Example

Once the installation process is complete, we can import the **NestjsJsonRpcModule** into the root **AppModule**.

```typescript
import {Module} from '@nestjs/common';
import { NestjsJsonRpcModule, TransportType } from '@klerick/nestjs-json-rpc';

@Module({
  imports: [
    NestjsJsonRpcModule.forRoot({
      path: 'rpc',
      transport: TransportType.HTTP,
    }),
  ],
})
export class AppModule {
}
```
so, now you have rpc server which allow:
- POST /rpc

### If you want to use Websocket: 

```typescript
import {Module} from '@nestjs/common';
import { NestjsJsonRpcModule, TransportType } from '@klerick/nestjs-json-rpc';

@Module({
  imports: [
    NestjsJsonRpcModule.forRoot({
      path: 'rpc',
      wsConfig: {
        path: '/rpc',
      },
    }),
  ],
})
export class AppModule {
}
```
`wsConfig` - is GatewayMetadata from `@nestjs/websockets/interfaces`;

***!!!!***: - NestJs by default using **socket.io** adapter, if you want to use native WebSocket, you should use  **WsAdapter**
```typescript
import { WsAdapter } from '@nestjs/platform-ws';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.init()
  await app.listen(3000);
}
```

To allow service to your RPC server, you should create class and add to providers the root **AppModule**.

```typescript
import {Module} from '@nestjs/common';
import { 
  NestjsJsonRpcModule, 
  TransportType,
  RpcHandler,
  RpcParamsPipe,
  createErrorCustomError,
} from '@klerick/nestjs-json-rpc';

@RpcHandler()
export class RpcService {
  methodeWithObjectParams(a: InputType): Promise<OutputType> {
    return Promise.resolve({
      d: `${a.a}`,
      c: `${a.b}`,
    });
  }

  someMethode(@RpcParamsPipe(ParseIntPipe) firstArg: number): Promise<number> {
    if (firstArg === 5) throw createErrorCustomError(-32099, 'Custom Error');
    return Promise.resolve(firstArg);
  }

  someOtherMethode(firstArg: number, secondArgument: number): Promise<string> {
    return Promise.resolve('');
  }
}

@Module({
  imports: [
    NestjsJsonRpcModule.forRoot({
      path: 'rpc',
      transport: TransportType.HTTP,
    }),
  ],
  providers: [RpcService],
})
export class AppModule {
}
```
`@RpcHandler` - decorator which mark class as RPC service

`@RpcParamsPipe` - decorator for validate input data, 


After it, you can call you RPC service: 

 ```
  POST /rpc
```

- **body** - for http request

```json
{"jsonrpc": "2.0", "method": "RpcService.methodeWithObjectParams", "params": {"a": 23}, "id": 1}
```

or RPC call Batch

```json
[
  {"jsonrpc": "2.0", "method": "RpcService.methodeWithObjectParams", "params": {"a": 23}, "id": 1},
  {"jsonrpc": "2.0", "method": "RpcService.someOtherMethode", "params": [1, 2], "id": 2}
]
```

