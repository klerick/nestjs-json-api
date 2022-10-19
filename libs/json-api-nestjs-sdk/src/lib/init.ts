import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentInjector,
  NgZone,
  StaticProvider,
  ɵcreateInjector as createInjector,
} from '@angular/core';
import { BrowserModule, platformBrowser } from '@angular/platform-browser';

import { JsonApiSdkConfig, ListEntities } from './token/json-api-sdk';
import { JsonApiSdkService } from './service/json-api-sdk/json-api-sdk.service';
import { JsonApiUtilsService } from './service/json-api-utils/json-api-utils.service';
import { JsonApiNestjsSdkModule } from './json-api-nestjs-sdk.module';
import { NoopNgZone } from './utils/noop-ng-zone';

let JsonApiSdkServiceLink: JsonApiSdkService;

export function getInstance(
  config: JsonApiSdkConfig,
  entities: ListEntities
): JsonApiSdkService;
export function getInstance(): JsonApiSdkService;
export function getInstance(...arg: any[]): JsonApiSdkService {
  if (JsonApiSdkServiceLink) {
    return JsonApiSdkServiceLink;
  }

  if (arg.length === 0 && JsonApiSdkServiceLink === undefined) {
    throw Error('Need init sdk');
  }

  const [config, entities] = arg;

  const JsonApiNestjs = JsonApiNestjsSdkModule.forRoot(config, entities);

  const extraProviders: StaticProvider[] = [
    { provide: NgZone, useValue: new NoopNgZone() },
    {
      provide: EnvironmentInjector,
      useValue: {},
    },
  ];

  const browserInjector = createInjector(
    BrowserModule,
    platformBrowser(extraProviders).injector,
    extraProviders
  );

  const contextInjector = createInjector(JsonApiNestjs, browserInjector, [
    {
      provide: JsonApiSdkService,
      useClass: JsonApiSdkService,
    },
    {
      provide: JsonApiUtilsService,
      useClass: JsonApiUtilsService,
    },
  ]);

  JsonApiSdkServiceLink =
    contextInjector.get<JsonApiSdkService>(JsonApiSdkService);
  return JsonApiSdkServiceLink;
}
