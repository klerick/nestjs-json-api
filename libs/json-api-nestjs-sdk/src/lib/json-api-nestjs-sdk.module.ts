import {
  Inject,
  ModuleWithProviders,
  NgModule,
  Optional,
  Provider,
  Self,
  SkipSelf,
} from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import {
  ALL_ENTITIES,
  JSON_API_SDK_CONFIG,
  JsonApiSdkConfig,
  ListEntities,
  PATCH_ENTITIES,
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

  public static forChild(
    entities: ListEntities
  ): ModuleWithProviders<JsonApiNestjsSdkModule> {
    return {
      ngModule: JsonApiNestjsSdkModule,
      providers: [
        {
          provide: PATCH_ENTITIES,
          useValue: entities,
        },
      ],
    };
  }
  constructor(
    @Optional() @SkipSelf() parentModule: JsonApiNestjsSdkModule,
    @Optional()
    @Self()
    @Inject(PATCH_ENTITIES)
    patchEntities: ListEntities,
    @Optional()
    @SkipSelf()
    @Inject(ALL_ENTITIES)
    allEntities: ListEntities
  ) {
    if (parentModule) {
      Object.assign(allEntities, patchEntities);
    }
  }
}
