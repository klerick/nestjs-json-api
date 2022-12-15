import { inject, InjectionToken } from '@angular/core';

export interface JsonApiSdkConfig {
  apiHost: string;
  apiPrefix?: string;
}

export interface ListEntities {
  [key: string]: { new (): any };
}

export const JSON_API_SDK_CONFIG = new InjectionToken<JsonApiSdkConfig>(
  'Main config object for sdk'
  // {
  //   // providedIn: JsonApiNestjsSdkModule,
  //   factory: () => {
  //     console.log(inject(API_SDK_CONFIG, { optional: true }));
  //     return inject(API_SDK_CONFIG, { optional: true }) as any;
  //   },
  // }
);

export const API_SDK_CONFIG = new InjectionToken<JsonApiSdkConfig>(
  'Config object for sdk'
);
export const ALL_ENTITIES = new InjectionToken<ListEntities>(
  'All List of all typeorm entities'
);

export const PATCH_ENTITIES = new InjectionToken<ListEntities>(
  'Patch list of all typeorm entities'
);
