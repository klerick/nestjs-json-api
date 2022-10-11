import { ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import {
  ALL_ENTITIES,
  JSON_API_SDK_CONFIG,
  JsonApiSdkConfig,
  ListEntities,
} from './token/json-api-sdk';

@NgModule({
  imports: [HttpClientModule],
})
export class JsonApiNestjsSdkModule {
  public static forRoot(
    config: JsonApiSdkConfig,
    entities: ListEntities
  ): ModuleWithProviders<JsonApiNestjsSdkModule> {
    const providers: Provider[] = [
      {
        provide: JSON_API_SDK_CONFIG,
        useValue: config,
      },
      {
        provide: ALL_ENTITIES,
        useValue: entities,
      },
    ];

    return {
      ngModule: JsonApiNestjsSdkModule,
      providers,
    };
  }
}
