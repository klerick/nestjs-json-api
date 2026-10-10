import {
  inject,
  makeEnvironmentProviders,
  InjectionToken,
} from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
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
 *
 * The context, when the config carries one, is attached to every request. A
 * provider built inside a nested component gets its own config while the
 * interceptors stay global, and the context is what tells them which instance
 * a request came from.
 */
export function createHttpInnerClient(
  httpClient: HttpClient,
  context?: HttpContext
): HttpInnerClient {
  const withContext = (options?: object) => {
    if (!context) {
      return options;
    }

    return { ...(options ?? {}), context };
  };

  return {
    get: (url: string, options?: { params: ParamObject }) =>
      (httpClient.get as (u: string, o?: unknown) => unknown)(
        url,
        withContext(options)
      ),
    post: (url: string, body: unknown) =>
      (httpClient.post as (u: string, b: unknown, o?: unknown) => unknown)(
        url,
        body,
        withContext()
      ),
    patch: (url: string, body: unknown) =>
      (httpClient.patch as (u: string, b: unknown, o?: unknown) => unknown)(
        url,
        body,
        withContext()
      ),
    delete: (url: string, body?: unknown) =>
      (httpClient.delete as (u: string, o?: unknown) => unknown)(
        url,
        withContext(body === undefined ? undefined : { body })
      ),
  } as HttpInnerClient;
}

/**
 * The base config plus what only makes sense under Angular. HttpContext stays
 * out of JsonSdkConfig so the core keeps no Angular types.
 */
export type JsonSdkAngularConfig = JsonSdkConfig & {
  /**
   * Attached to every request the SDK makes, for global interceptors to read.
   */
  httpContext?: HttpContext;
};

export type JsonSdkConfigFactory = () => JsonSdkAngularConfig;
export type JsonSdkConfigOrFactory =
  | JsonSdkAngularConfig
  | JsonSdkConfigFactory;

const isFactory = (config: JsonSdkConfigOrFactory): config is JsonSdkConfigFactory =>
  typeof config === 'function';

/**
 * The config as given, before defaults are filled in. It exists so a config
 * factory runs once no matter how many providers below read it.
 */
const RESOLVED_SDK_CONFIG = new InjectionToken<JsonSdkAngularConfig>(
  'Config as supplied to provideJsonApi'
);

export const getProviders = (configOrFactory: JsonSdkConfigOrFactory) => [
  {
    provide: RESOLVED_SDK_CONFIG,
    useFactory: () =>
      isFactory(configOrFactory) ? configOrFactory() : configOrFactory,
  },
  {
    provide: JSON_API_SDK_CONFIG,
    useFactory: () => resultConfig(inject(RESOLVED_SDK_CONFIG)),
  },
  {
    provide: JsonApiUtilsService,
    useFactory: () => new JsonApiUtilsService(inject(JSON_API_SDK_CONFIG)),
  },
  {
    provide: JsonApiSdkService,
    useFactory: () =>
      new JsonApiSdkService(
        createHttpInnerClient(
          inject(HttpClient),
          inject(RESOLVED_SDK_CONFIG).httpContext
        ),
        inject(JsonApiUtilsService),
        inject(JSON_API_SDK_CONFIG)
      ),
  },
  {
    provide: AtomicFactory,
    useFactory: () => {
      const jsonApiUtilsService = inject(JsonApiUtilsService);
      const config = inject(JSON_API_SDK_CONFIG);
      const httpClient = createHttpInnerClient(
        inject(HttpClient),
        inject(RESOLVED_SDK_CONFIG).httpContext
      );

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
