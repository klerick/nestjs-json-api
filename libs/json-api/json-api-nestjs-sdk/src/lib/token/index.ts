import { InjectionToken } from '@angular/core';

import { JsonApiSdkConfig } from '../types';
import { AtomicFactory as TypeAtomicFactory } from '../types/atomic';

export const JSON_API_SDK_CONFIG = new InjectionToken<JsonApiSdkConfig>(
  'Main config object for sdk'
);

export const AtomicFactory = new InjectionToken<TypeAtomicFactory>(
  'AtomicFactory'
);
