import { InjectionToken } from '@angular/core';

import { JsonApiSdkConfig, AtomicFactory as TypeAtomicFactory } from '../types';

export const JSON_API_SDK_CONFIG = new InjectionToken<JsonApiSdkConfig>(
  'Main config object for sdk'
);

export const AtomicFactory = new InjectionToken<TypeAtomicFactory>(
  'AtomicFactory'
);
