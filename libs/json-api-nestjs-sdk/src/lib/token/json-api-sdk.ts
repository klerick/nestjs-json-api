import { InjectionToken } from '@angular/core';

export interface JsonApiSdkConfig {
  apiHost: string;
  apiPrefix?: string;
}

export interface ListEntities {
  [key: string]: { new (): any };
}

export const JSON_API_SDK_CONFIG = new InjectionToken<JsonApiSdkConfig>(
  'Config object for sdk'
);
export const ALL_ENTITIES = new InjectionToken<ListEntities>(
  'List of all typeorm entities'
);
