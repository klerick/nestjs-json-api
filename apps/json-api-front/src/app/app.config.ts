import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { JsonApiAngular } from 'json-api-nestjs-sdk/json-api-nestjs-sdk.module';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      JsonApiAngular.forRoot({
        apiHost: 'http://localhost:4200',
        idKey: 'id',
        apiPrefix: 'api',
        operationUrl: 'operation',
      })
    ),
  ],
};
