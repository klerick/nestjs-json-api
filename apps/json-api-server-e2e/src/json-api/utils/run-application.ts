import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { adapterForAxios, JsonApiJs } from '@klerick/json-api-nestjs-sdk';
import {
  RpcFactory,
  axiosTransportFactory,
  RpcConfig,
} from '@klerick/nestjs-json-rpc-sdk';
import { RpcService } from '@nestjs-json-api/type-for-rpc';
import { TransportType } from '@klerick/nestjs-json-rpc-sdk';
import axios from 'axios';
import { Logger } from 'nestjs-pino';
import { WebSocket } from 'ws';

import { AppModule } from '../../../../json-api-server/src/app/app.module';

import { JsonConfig } from '../../../../../libs/json-api/json-api-nestjs-sdk/src/lib/types';
import { WsAdapter } from '@nestjs/platform-ws';
import { Subject } from 'rxjs';

export const axiosAdapter = adapterForAxios(axios);
let saveApp: INestApplication;

export const port = 3000;
export const globalPrefix = 'api';
export const run = async () => {
  if (saveApp) return saveApp;
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication({
    bufferLogs: true,
    logger: false,
  });
  app.useLogger(app.get(Logger));
  // const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(globalPrefix);
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.init();
  await app.listen(port);

  saveApp = app;
  return app;
};

export const creatSdk = (config: Partial<JsonConfig> = {}) =>
  JsonApiJs(
    {
      adapter: axiosAdapter,
      apiHost: `http://localhost:${port}`,
      apiPrefix: globalPrefix,
      dateFields: ['createdAt', 'updatedAt'],
      operationUrl: 'operation',
      ...config,
    },
    true
  );

export type MapperRpc = {
  RpcService: RpcService;
};

export const creatRpcSdk = (config: Partial<RpcConfig> = {}) =>
  RpcFactory<MapperRpc>(
    {
      ...config,
      rpcHost: `http://localhost:${port}`,
      rpcPath: `/api/rpc`,
      transport: TransportType.HTTP,
      httpAgentFactory: axiosTransportFactory(axios),
    },
    true
  );
export const destroySubject = new Subject<boolean>();
export const creatWsRpcSdk = (config: Partial<RpcConfig> = {}) =>
  RpcFactory<MapperRpc>(
    {
      transport: TransportType.WS,
      useWsNativeSocket: true,
      nativeSocketImplementation: WebSocket,
      rpcHost: `http://localhost:${port}`,
      rpcPath: `/rpc`,
      destroySubject,
    },
    true
  );
