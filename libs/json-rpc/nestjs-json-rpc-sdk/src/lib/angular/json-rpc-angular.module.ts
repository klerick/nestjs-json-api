import { makeEnvironmentProviders } from '@angular/core';

import { JSON_RPC_SDK_CONFIG } from './tokens';
import { JsonRpcAngularConfig } from '../types';

export const provideJsonRpc = (config: JsonRpcAngularConfig) =>
  makeEnvironmentProviders([
    {
      useValue: config,
      provide: JSON_RPC_SDK_CONFIG,
    },
  ]);
