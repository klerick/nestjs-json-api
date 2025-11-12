import { adapterForAxios, JsonApiJs, JsonConfig } from '@klerick/json-api-nestjs-sdk';
import {
  RpcFactory,
  axiosTransportFactory,
  RpcConfig,
} from '@klerick/nestjs-json-rpc-sdk';
import { RpcService } from '@nestjs-json-api/type-for-rpc';
import { TransportType } from '@klerick/nestjs-json-rpc-sdk';
import axios from 'axios';
import { WebSocket } from 'ws';

import { Subject } from 'rxjs';

export const axiosAdapter = adapterForAxios(axios);

export const port = 3000;
export const globalPrefix = 'api';

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
