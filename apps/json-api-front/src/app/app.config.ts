import {
  ApplicationConfig,
  importProvidersFrom,
  InjectionToken,
} from '@angular/core';
import { JsonApiAngular } from 'json-api-nestjs-sdk/json-api-nestjs-sdk.module';
import {
  JsonRpcAngular,
  JsonRpcAngularConfig,
  TransportType,
} from '@klerick/nestjs-json-rpc-sdk/json-rpc-sdk.module';
import { Subject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { io } from 'socket.io-client';

const destroySubject = new Subject<boolean>();
setTimeout(() => {
  console.log('Disconnect');
  destroySubject.next(true);
  destroySubject.complete();
}, 5000);
const destroySubjectToken = new InjectionToken('destroySubjectToken', {
  factory: () => destroySubject,
});
destroySubject.subscribe((r) => console.log(r));
const tokenSocketInst = new InjectionToken('tokenSocketInst', {
  factory: () => webSocket('ws://localhost:4200/rpc'),
});

const tokenIoSocketInst = new InjectionToken('tokenIoSocketInst', {
  factory: () => io('http://localhost:3000', { path: '/rpc' }),
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

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      JsonApiAngular.forRoot({
        apiHost: 'http://localhost:4200',
        idKey: 'id',
        apiPrefix: 'api',
        operationUrl: 'operation',
      })
    ),
    importProvidersFrom(
      JsonRpcAngular.forRoot(
        // httpConfig
        // wsConfig
        // wsConfigWithToken,
        ioConfig
      )
    ),
  ],
};
