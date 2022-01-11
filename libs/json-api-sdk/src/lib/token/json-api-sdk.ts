import { InjectionToken } from '@angular/core';

export interface JsonApiSdkConfig{
  apiHost: string,
  apiPrefix?: string,
}

export const JSON_API_SDK_CONFIG = new InjectionToken<JsonApiSdkConfig>('Config object for sdk');
