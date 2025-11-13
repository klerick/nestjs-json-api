<p align='center'>
  <a href="https://www.npmjs.com/package/@klerick/nestjs-json-rpc-sdk" target="_blank"><img src="https://img.shields.io/npm/v/@klerick/nestjs-json-rpc-sdk.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@klerick/nestjs-json-rpc-sdk" target="_blank"><img src="https://img.shields.io/npm/l/@klerick/nestjs-json-rpc-sdk.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@klerick/nestjs-json-rpc-sdk" target="_blank"><img src="https://img.shields.io/npm/dm/@klerick/nestjs-json-rpc-sdk.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/02a4c98cf7008fea2af70dc2d50f4cb7/raw/nestjs-json-rpc-sdk.json" alt="Coverage Badge" />
</p>

# JSON-RPC 2.0 Client SDK

Type-safe TypeScript/JavaScript client for consuming [JSON-RPC 2.0](https://www.jsonrpc.org/) endpoints built with [@klerick/nestjs-json-rpc](https://www.npmjs.com/package/@klerick/nestjs-json-rpc).

Call remote procedures as if they were local functions with full TypeScript type safety.

## ✨ Features

- 🎯 **Full Type Safety** - Complete TypeScript support with automatic type inference
- 📦 **Batch Requests** - Execute multiple RPC calls in a single request
- 🌐 **Multiple Transports** - HTTP, WebSocket, and Socket.IO support
- 🔄 **Observable or Promise** - Choose between RxJS Observable or native Promise
- ⚡ **Multiple HTTP Clients** - Works with Axios, Fetch API, and Angular HttpClient
- 🛡️ **Error Handling** - Comprehensive JSON-RPC 2.0 error handling with custom error types
- 🔌 **Real-time Communication** - WebSocket support for bidirectional RPC calls

## 📚 Table of Contents

- [Installation](#installation)
- [Quick Start](#-quick-start)
  - [HTTP Transport](#http-transport-axios)
  - [WebSocket Transport](#websocket-transport)
- [Configuration](#-configuration)
- [API Usage](#-api-usage)
  - [Single RPC Call](#single-rpc-call)
  - [Batch Requests](#batch-requests)
  - [Error Handling](#error-handling)
- [Transport Options](#-transport-options)
  - [HTTP with Axios](#http-with-axios)
  - [HTTP with Fetch](#http-with-fetch-default)
  - [WebSocket (Native)](#websocket-native)
  - [Socket.IO](#socketio)
- [Angular Integration](#-angular-integration)
- [Examples](#-examples)

## Installation

```bash
npm install @klerick/nestjs-json-rpc-sdk
```

---

## 🚀 Quick Start

### Define Your RPC Service Interface

First, define the TypeScript interface for your RPC service:

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
  someMethode(firstArg: number): Promise<number>;
  methodeWithObjectParams(input: InputType): Promise<OutputType>;
}

// Create type mapper for your services
type MapperRpc = {
  RpcService: RpcService;
};
```

### HTTP Transport (Axios)

```typescript
import {
  RpcFactory,
  TransportType,
  axiosTransportFactory,
} from '@klerick/nestjs-json-rpc-sdk';
import axios from 'axios';

// Configure RPC client
const { rpc, rpcBatch, rpcForBatch } = RpcFactory<MapperRpc>(
  {
    rpcHost: 'http://localhost:3000',
    rpcPath: '/api/rpc',
    transport: TransportType.HTTP,
    httpAgentFactory: axiosTransportFactory(axios),
  },
  true // true = return Promises, false = return Observables
);

// Single RPC call
const result = await rpc.RpcService.someMethode(1);
console.log(result); // 1

// Batch RPC calls
const call1 = rpcForBatch.RpcService.someMethode(1);
const call2 = rpcForBatch.RpcService.methodeWithObjectParams({ a: 1, b: 2 });

const [result1, result2] = await rpcBatch(call1, call2);
console.log(result1); // 1
console.log(result2); // { c: '2', d: '1' }
```

### WebSocket Transport

```typescript
import {
  RpcFactory,
  TransportType,
} from '@klerick/nestjs-json-rpc-sdk';
import { WebSocket } from 'ws';
import { Subject } from 'rxjs';

// Create destroy subject for connection management
const destroySubject = new Subject<boolean>();

const { rpc, rpcBatch, rpcForBatch } = RpcFactory<MapperRpc>(
  {
    transport: TransportType.WS,
    useWsNativeSocket: true,
    nativeSocketImplementation: WebSocket,
    rpcHost: 'http://localhost:3000',
    rpcPath: '/rpc',
    destroySubject,
  },
  true
);

// Use RPC over WebSocket
const result = await rpc.RpcService.someMethode(1);

// Close connection when done
destroySubject.next(true);
destroySubject.complete();
```

---

## ⚙️ Configuration

### RpcFactory Parameters

```typescript
RpcFactory<T>(config: RpcConfig, usePromise: boolean)
```

**Parameters:**
- `config`: RpcConfig - Configuration object
- `usePromise`: boolean
  - `true` - Methods return `Promise<T>`
  - `false` - Methods return `Observable<T>` (default)

**Returns:**
```typescript
{
  rpc: Rpc<T>,              // For single calls
  rpcBatch: RpcBatch,       // Execute batch requests
  rpcForBatch: Rpc<T>       // Prepare calls for batching (only with Promise)
}
```

### RpcConfig Type

```typescript
type RpcConfig = {
  rpcHost: string;                    // RPC server URL
  rpcPath: string;                    // RPC endpoint path
  transport: TransportType;           // HTTP or WS
  httpAgentFactory?: HttpAgentFactory; // HTTP client (for HTTP transport)
  useWsNativeSocket?: boolean;        // Use native WebSocket (for WS transport)
  nativeSocketImplementation?: any;   // WebSocket implementation (Node.js)
  ioSocketInstance?: Socket;          // Socket.IO instance
  nativeSocketInstance?: WebSocketSubject<any>; // RxJS WebSocket
  destroySubject?: Subject<boolean>;  // Connection lifecycle management
}
```

---

## 📖 API Usage

### Single RPC Call

```typescript
// With Promise
const result = await rpc.RpcService.someMethode(1);

// With Observable
rpc.RpcService.someMethode(1).subscribe(result => {
  console.log(result);
});
```

### Batch Requests

Execute multiple RPC calls in a single HTTP request for better performance.

**With Promise:**
```typescript
const { rpc, rpcBatch, rpcForBatch } = RpcFactory<MapperRpc>(config, true);

// Prepare calls
const call1 = rpcForBatch.RpcService.someMethode(1);
const call2 = rpcForBatch.RpcService.methodeWithObjectParams({ a: 1, b: 2 });

// Execute batch
const [result1, result2] = await rpcBatch(call1, call2);

// Check for errors in individual results
if ('error' in result2) {
  console.error('Call 2 failed:', result2.error);
} else {
  console.log(result2); // Success
}
```

**With Observable:**
```typescript
const { rpc, rpcBatch } = RpcFactory<MapperRpc>(config, false);

// Prepare calls
const call1 = rpc.RpcService.someMethode(1);
const call2 = rpc.RpcService.methodeWithObjectParams({ a: 1, b: 2 });

// Execute batch
rpcBatch(call1, call2).subscribe(([result1, result2]) => {
  console.log(result1, result2);
});
```

### Error Handling

JSON-RPC 2.0 defines standard error codes:

```typescript
import { RpcError, ErrorCodeType } from '@klerick/nestjs-json-rpc-sdk';

try {
  await rpc.RpcService.someMethode(5);
} catch (error) {
  if (error instanceof RpcError) {
    console.log(error.code);    // -32099
    console.log(error.message); // "ServerError"
    console.log(error.data);    // { title: 'Custom Error' }
  }
}
```

**Standard Error Codes:**

| Code | Message | Description |
|------|---------|-------------|
| -32700 | ParseError | Invalid JSON |
| -32600 | InvalidRequest | Invalid Request object |
| -32601 | MethodNotFound | Method doesn't exist |
| -32602 | InvalidParams | Invalid method parameters |
| -32603 | InternalError | Internal JSON-RPC error |
| -32000 to -32099 | ServerError | Server-defined errors |

**Example: Method Not Found**
```typescript
try {
  // @ts-ignore
  await rpc.IncorrectService.incorrectMethode(1);
} catch (error) {
  console.log(error instanceof RpcError); // true
  console.log(error.code);                // -32601
  console.log(error.message);             // "MethodNotFound"
}
```

**Example: Invalid Parameters**
```typescript
try {
  // @ts-ignore
  await rpc.RpcService.someMethode('invalid'); // expects number
} catch (error) {
  console.log(error.code);    // -32602
  console.log(error.message); // "InvalidParams"
}
```

### TypeScript Type Safety

TypeScript will catch errors at compile time:

```typescript
type MapperRpc = {
  RpcService: RpcService;
};

const { rpc } = RpcFactory<MapperRpc>(config, true);

// ❌ TypeScript Error: Argument of type 'string' is not assignable to parameter of type 'number'
const call1 = rpc.RpcService.someMethode('incorrect');

// ❌ TypeScript Error: Property 'IncorrectService' does not exist on type 'MapperRpc'
const call2 = rpc.IncorrectService.someMethode(1);

// ❌ TypeScript Error: Property 'incorrectMethod' does not exist on type 'RpcService'
const call3 = rpc.RpcService.incorrectMethod(1);

// ✅ Correct
const call4 = rpc.RpcService.someMethode(1);
```

---

## 🌐 Transport Options

### HTTP with Axios

```typescript
import { RpcFactory, TransportType, axiosTransportFactory } from '@klerick/nestjs-json-rpc-sdk';
import axios from 'axios';

const { rpc } = RpcFactory<MapperRpc>(
  {
    rpcHost: 'http://localhost:3000',
    rpcPath: '/api/rpc',
    transport: TransportType.HTTP,
    httpAgentFactory: axiosTransportFactory(axios),
  },
  true
);
```

### HTTP with Fetch (Default)

```typescript
import { RpcFactory, TransportType } from '@klerick/nestjs-json-rpc-sdk';

const { rpc } = RpcFactory<MapperRpc>(
  {
    rpcHost: 'http://localhost:3000',
    rpcPath: '/api/rpc',
    transport: TransportType.HTTP,
    // No httpAgentFactory needed - uses fetch by default
  },
  true
);
```

### WebSocket (Native)

```typescript
import { RpcFactory, TransportType } from '@klerick/nestjs-json-rpc-sdk';
import { WebSocket } from 'ws'; // For Node.js
import { Subject } from 'rxjs';

const destroySubject = new Subject<boolean>();

const { rpc } = RpcFactory<MapperRpc>(
  {
    transport: TransportType.WS,
    useWsNativeSocket: true,
    nativeSocketImplementation: WebSocket, // Required in Node.js
    rpcHost: 'http://localhost:3000',
    rpcPath: '/rpc',
    destroySubject,
  },
  true
);

// Close connection
destroySubject.next(true);
destroySubject.complete();
```

### Socket.IO

```typescript
import { RpcFactory, TransportType } from '@klerick/nestjs-json-rpc-sdk';
import { io } from 'socket.io-client';
import { Subject } from 'rxjs';

const destroySubject = new Subject<boolean>();
const ioSocketInstance = io('http://localhost:3000', { path: '/rpc' });

const { rpc } = RpcFactory<MapperRpc>(
  {
    transport: TransportType.WS,
    useWsNativeSocket: false, // Use Socket.IO
    ioSocketInstance,
    destroySubject,
  },
  true
);

// Close connection
destroySubject.next(true);
destroySubject.complete();
```

### Custom HTTP Client

Implement your own HTTP transport by implementing the `HttpAgentFactory` type:

```typescript
import { HttpAgentFactory, Transport, PayloadRpc, RpcResult } from '@klerick/nestjs-json-rpc-sdk';
import { Observable } from 'rxjs';

type Transport<T> = (body: PayloadRpc<T>) => Observable<RpcResult<T>>;
type HttpAgentFactory<T> = (url: string) => Transport<T>;

// Implement your custom factory
const myCustomFactory: HttpAgentFactory = (url) => (body) => {
  // Your custom HTTP logic
  return new Observable(/* ... */);
};
```

---

## 🅰️ Angular Integration

Use the Angular module for dependency injection and configuration:

```typescript
import {
  provideJsonRpc,
  JsonRpcAngularConfig,
  TransportType,
} from '@klerick/nestjs-json-rpc-sdk/ngModule';
import {
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import { Component, inject, InjectionToken } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { io } from 'socket.io-client';
import {
  JSON_RPC,
  RPC_BATCH,
  Rpc,
} from '@klerick/nestjs-json-rpc-sdk/json-rpc-sdk.module';

// 1. Configure HTTP transport
const httpConfig: JsonRpcAngularConfig = {
  transport: TransportType.HTTP,
  rpcPath: '/api/rpc',
  rpcHost: 'http://localhost:3000',
};

// 2. Bootstrap application
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideJsonRpc(httpConfig),
  ],
}).catch((err) => console.error(err));

// 3. Use in components
@Component({
  standalone: true,
  selector: 'app-rpc-client',
  templateUrl: './rpc-client.component.html',
})
export class AppComponent {
  private rpc = inject<Rpc<MapperRpc>>(JSON_RPC);
  private rpcBatch = inject(RPC_BATCH);

  async callRpc() {
    const result = await this.rpc.RpcService.someMethode(1);
    console.log(result);
  }

  async callBatch() {
    const call1 = this.rpc.RpcService.someMethode(1);
    const call2 = this.rpc.RpcService.methodeWithObjectParams({ a: 1, b: 2 });
    const [result1, result2] = await this.rpcBatch(call1, call2);
    console.log(result1, result2);
  }
}
```

### Angular WebSocket Configuration

```typescript
const destroySubjectToken = new InjectionToken('destroySubjectToken', {
  factory: () => new Subject<boolean>(),
});

const tokenSocketInst = new InjectionToken('tokenSocketInst', {
  factory: () => webSocket('ws://localhost:3000/rpc'),
});

// WebSocket with native implementation
const wsConfig: JsonRpcAngularConfig = {
  transport: TransportType.WS,
  useWsNativeSocket: true,
  rpcPath: 'rpc',
  rpcHost: 'ws://localhost:3000',
  destroySubjectToken,
};

// WebSocket with custom instance
const wsConfigWithToken: JsonRpcAngularConfig = {
  transport: TransportType.WS,
  useWsNativeSocket: true,
  tokenSocketInst,
  destroySubjectToken,
};
```

### Angular Socket.IO Configuration

```typescript
const tokenIoSocketInst = new InjectionToken('tokenIoSocketInst', {
  factory: () => io('http://localhost:3000', { path: '/rpc' }),
});

const ioConfig: JsonRpcAngularConfig = {
  transport: TransportType.WS,
  useWsNativeSocket: false,
  destroySubjectToken,
  tokenSocketInst: tokenIoSocketInst,
};
```

---

## 💡 Examples

For comprehensive real-world examples, see the [E2E test suite](https://github.com/klerick/nestjs-json-api/tree/master/apps/json-api-server-e2e/src/json-api/json-rpc):

- **[HTTP Transport](https://github.com/klerick/nestjs-json-api/blob/master/apps/json-api-server-e2e/src/json-api/json-rpc/run-json-rpc.spec.ts)** - Single and batch RPC calls over HTTP, error handling
- **[WebSocket Transport](https://github.com/klerick/nestjs-json-api/blob/master/apps/json-api-server-e2e/src/json-api/json-rpc/run-ws-json-rpc.spec.ts)** - Real-time RPC over WebSocket connections

---

## 📝 License

MIT

---

## 🔗 Related Packages

- [@klerick/nestjs-json-rpc](https://www.npmjs.com/package/@klerick/nestjs-json-rpc) - JSON-RPC 2.0 server implementation for NestJS


