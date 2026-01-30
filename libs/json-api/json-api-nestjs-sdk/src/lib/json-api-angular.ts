import { inject, makeEnvironmentProviders } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpInnerClient, JsonSdkConfig } from './types';
import { AtomicFactory, JSON_API_SDK_CONFIG } from './token';
import { resultConfig } from './utils';
import {
  JsonApiUtilsService,
  JsonApiSdkService,
  AtomicOperationsService,
} from './service';

export type JsonSdkConfigFactory = () => JsonSdkConfig;
export type JsonSdkConfigOrFactory = JsonSdkConfig | JsonSdkConfigFactory;

const isFactory = (config: JsonSdkConfigOrFactory): config is JsonSdkConfigFactory =>
  typeof config === 'function';

export const getProviders = (configOrFactory: JsonSdkConfigOrFactory) => [
  {
    provide: JSON_API_SDK_CONFIG,
    useFactory: () => {
      const config = isFactory(configOrFactory) ? configOrFactory() : configOrFactory;
      return resultConfig(config);
    },
  },
  {
    provide: JsonApiUtilsService,
    useFactory: () => new JsonApiUtilsService(inject(JSON_API_SDK_CONFIG)),
  },
  {
    provide: JsonApiSdkService,
    useFactory: () =>
      new JsonApiSdkService(
        inject<HttpInnerClient>(HttpClient as any),
        inject(JsonApiUtilsService),
        inject(JSON_API_SDK_CONFIG)
      ),
  },
  {
    provide: AtomicFactory,
    useFactory: () => {
      const jsonApiUtilsService = inject(JsonApiUtilsService);
      const config = inject(JSON_API_SDK_CONFIG);
      const httpClient = inject<HttpInnerClient>(HttpClient as any);

      return () => {
        return new AtomicOperationsService(
          jsonApiUtilsService,
          config,
          httpClient
        );
      };
    },
  },
];

export const provideJsonApi = (configOrFactory: JsonSdkConfigOrFactory) =>
  makeEnvironmentProviders(getProviders(configOrFactory));

export { AtomicFactory, JSON_API_SDK_CONFIG } from './token';
