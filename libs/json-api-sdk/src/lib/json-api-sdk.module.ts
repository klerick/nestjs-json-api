import { ModuleWithProviders, NgModule, Provider} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import {
  JSON_API_SDK_CONFIG,
  JsonApiSdkConfig,
  ListEntities,
  ALL_ENTITIES,
} from './token/json-api-sdk';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ]
})
export class JsonApiSdkModule {

  public static forRoot(config: JsonApiSdkConfig, entities: ListEntities): ModuleWithProviders<JsonApiSdkModule>{
    const providers: Provider[] = [{
      provide: JSON_API_SDK_CONFIG,
      useValue: config
    }, {
      provide: ALL_ENTITIES,
      useValue: entities
    }];

    return {
      ngModule: JsonApiSdkModule,
      providers
    };
  }
}
