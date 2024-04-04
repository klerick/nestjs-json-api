import { InjectionToken } from '@angular/core';
import { LoopFunc, RpcBatch, RpcReturnList, Transport } from '../types';

import { JsonRpcAngularConfig } from '@klerick/nestjs-json-rpc-sdk/json-rpc-sdk.module';
import {
  angularTransportFactory,
  rpcBatchFactory,
  rpcFactory,
} from './factory';

export const JSON_RPC_SDK_CONFIG = new InjectionToken<JsonRpcAngularConfig>(
  'Main config object for sdk'
);

export const JSON_RPC_SDK_TRANSPORT = new InjectionToken<Transport<LoopFunc>>(
  'Transport for RPC',
  {
    factory: angularTransportFactory,
  }
);

export const JSON_RPC = new InjectionToken<RpcReturnList<object, false>>(
  'Rpc client',
  {
    factory: rpcFactory,
  }
);

export const RPC_BATCH = new InjectionToken<RpcBatch>('Rpc client for batch', {
  factory: rpcBatchFactory,
});
