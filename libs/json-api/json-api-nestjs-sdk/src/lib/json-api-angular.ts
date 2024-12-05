import {
  NgModule,
  ModuleWithProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpInnerClient, JsonSdkConfig } from './types';
import { AtomicFactory, JSON_API_SDK_CONFIG } from './token';
import { resultConfig } from './utils';
import {
  JsonApiUtilsService,
  JsonApiSdkService,
  AtomicOperationsService,
} from './service';

export const getProviders = (config: JsonSdkConfig) => [
  {
    provide: JSON_API_SDK_CONFIG,
    useValue: resultConfig(config),
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

export const provideJsonApi = (config: JsonSdkConfig) =>
  makeEnvironmentProviders(getProviders(config));

@NgModule({
  imports: [],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class JsonApiAngular {
  static forRoot(config: JsonSdkConfig): ModuleWithProviders<JsonApiAngular> {
    return {
      ngModule: JsonApiAngular,
      providers: getProviders(config),
    };
  }
}

export { AtomicFactory, JSON_API_SDK_CONFIG } from './token';
