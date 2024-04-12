import { ModuleWithProviders, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { JSON_RPC_SDK_CONFIG } from './tokens';
import { JsonRpcAngularConfig } from '../types';

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
