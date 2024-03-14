import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { JsonApiAngular } from 'json-api-nestjs-sdk/json-api-nestjs-sdk.module';
import {
  JsonRpcAngular,
  TransportType,
} from '@klerick/nestjs-json-rpc-sdk/json-rpc-sdk.module';

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
    importProvidersFrom(
      JsonRpcAngular.forRoot({
        transport: TransportType.HTTP,
        rpcPath: 'rpc',
        rpcHost: 'http://localhost:4200',
      })
    ),
  ],
};
