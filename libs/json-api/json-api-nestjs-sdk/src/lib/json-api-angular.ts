import { inject, makeEnvironmentProviders } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpInnerClient, JsonSdkConfig } from './types/index.js';
import { ParamObject } from './utils/index.js';
import { AtomicFactory, JSON_API_SDK_CONFIG } from './token/index.js';
import { resultConfig } from './utils/index.js';
import {
  JsonApiUtilsService,
  JsonApiSdkService,
  AtomicOperationsService,
} from './service/index.js';

/**
 * HttpClient and HttpInnerClient disagree about where things go, and injecting
 * the one as the other papered over it:
 *
 *   delete  HttpInnerClient takes the body second; HttpClient reads that
 *           position as options and expects the body inside them, so a body
 *           handed over as-is never reached the request.
 *   post    options come third for HttpClient, and HttpInnerClient has no slot
 *   patch   for them at all.
 *
 * Translating here keeps that knowledge in the one file that already knows
 * about Angular, and leaves the fetch and axios adapters untouched.
 */
export function createHttpInnerClient(httpClient: HttpClient): HttpInnerClient {
  return {
    get: (url: string, options?: { params: ParamObject }) =>
      (httpClient.get as (u: string, o?: unknown) => unknown)(url, options),
    post: (url: string, body: unknown) =>
      (httpClient.post as (u: string, b: unknown, o?: unknown) => unknown)(
        url,
        body,
        undefined
      ),
    patch: (url: string, body: unknown) =>
      (httpClient.patch as (u: string, b: unknown, o?: unknown) => unknown)(
        url,
        body,
        undefined
      ),
    delete: (url: string, body?: unknown) =>
      (httpClient.delete as (u: string, o?: unknown) => unknown)(
        url,
        body === undefined ? undefined : { body }
      ),
  } as HttpInnerClient;
}

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
        createHttpInnerClient(inject(HttpClient)),
        inject(JsonApiUtilsService),
        inject(JSON_API_SDK_CONFIG)
      ),
  },
  {
    provide: AtomicFactory,
    useFactory: () => {
      const jsonApiUtilsService = inject(JsonApiUtilsService);
      const config = inject(JSON_API_SDK_CONFIG);
      const httpClient = createHttpInnerClient(inject(HttpClient));

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

export { AtomicFactory, JSON_API_SDK_CONFIG } from './token/index.js';
