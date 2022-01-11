import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { JSON_API_SDK_CONFIG, JsonApiSdkConfig } from './token/json-api-sdk';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ]
})
export class JsonApiSdkModule {

  public static forRoot(config: JsonApiSdkConfig): ModuleWithProviders<JsonApiSdkModule> {
    return {
      ngModule: JsonApiSdkModule,
      providers: [{
        provide: JSON_API_SDK_CONFIG,
        useValue: config
      }]
    };
  }
}
