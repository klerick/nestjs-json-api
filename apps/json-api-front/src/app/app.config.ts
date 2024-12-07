import { ApplicationConfig, InjectionToken } from '@angular/core';
import { provideJsonApi } from 'json-api-nestjs-sdk/ngModule';
import {
  JsonRpcAngularConfig,
  TransportType,
  provideJsonRpc,
} from '@klerick/nestjs-json-rpc-sdk/ngModule';
import { Subject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { io } from 'socket.io-client';
import { provideHttpClient, withFetch } from '@angular/common/http';

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
    provideHttpClient(withFetch()),
    provideJsonApi({
      apiHost: 'http://localhost:4200',
      idKey: 'id',
      apiPrefix: 'api',
      operationUrl: 'operation',
    }),
    provideJsonRpc(
      // httpConfig
      // wsConfig
      // wsConfigWithToken,
      ioConfig
    ),
  ],
};
