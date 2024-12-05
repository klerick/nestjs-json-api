import {
  makeEnvironmentProviders,
  ModuleWithProviders,
  NgModule,
} from '@angular/core';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { JSON_RPC_SDK_CONFIG } from './tokens';
import { JsonRpcAngularConfig } from '../types';

export const provideJsonRpc = (config: JsonRpcAngularConfig) =>
  makeEnvironmentProviders([
    {
      useValue: config,
      provide: JSON_RPC_SDK_CONFIG,
    },
  ]);

@NgModule({
  imports: [],
  providers: [provideHttpClient(withInterceptorsFromDi())],
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
