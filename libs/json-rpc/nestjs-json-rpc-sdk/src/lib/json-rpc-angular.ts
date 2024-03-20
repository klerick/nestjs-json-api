import {
  inject,
  InjectionToken,
  ModuleWithProviders,
  NgModule,
} from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import {
  LoopFunc,
  RpcMainHttpConfig,
  RpcHttpConfig,
  RpcWsConfig,
  Transport,
  TransportType,
  PayloadRpc,
  RpcResult,
  RpcReturnList,
  RpcBatch,
} from './types';
import { transportFactory } from './factory';
import { RpcBatchFactory, rpcProxy } from './utils';

type Rpc<T extends object> = RpcReturnList<T, false>;

export { TransportType, Rpc };

export const JSON_RPC_SDK_CONFIG = new InjectionToken<JsonRpcAngularConfig>(
  'Main config object for sdk'
);

export const JSON_RPC_SDK_TRANSPORT = new InjectionToken<Transport<LoopFunc>>(
  'Transport for RPC',
  {
    factory: () => {
      const config = inject(JSON_RPC_SDK_CONFIG);
      const httpClient = inject(HttpClient);
      if (config.transport === TransportType.HTTP) {
        (config as unknown as RpcHttpConfig)['httpAgentFactory'] =
          (url: string) => (body: PayloadRpc<LoopFunc>) => {
            return httpClient.post<RpcResult<LoopFunc>>(url, body);
          };
      }
      return transportFactory(config);
    },
  }
);

export const JSON_RPC = new InjectionToken<RpcReturnList<object, false>>(
  'Rpc client',
  {
    factory: () =>
      rpcProxy<RpcReturnList<any, true>>(inject(JSON_RPC_SDK_TRANSPORT), false),
  }
);

export const RPC_BATCH = new InjectionToken<RpcBatch>('Rpc client for batch', {
  factory: () => RpcBatchFactory(inject(JSON_RPC_SDK_TRANSPORT)),
});

export type JsonRpcAngularConfig = RpcMainHttpConfig | RpcWsConfig;

@NgModule({
  imports: [HttpClientModule],
})
export class JsonRpcAngular {
  static forRoot(
    config: JsonRpcAngularConfig
  ): ModuleWithProviders<JsonRpcAngular> {
    return {
      ngModule: JsonRpcAngular,
      providers: [
        {
          useValue: config,
          provide: JSON_RPC_SDK_CONFIG,
        },
      ],
    };
  }
}
