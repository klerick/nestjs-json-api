import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { adapterForAxios, JsonApiJs } from 'json-api-nestjs-sdk';
import axios from 'axios';
import { Logger } from 'nestjs-pino';

import { AppModule } from '../../../../json-api-server/src/app/app.module';

import { JsonConfig } from '../../../../../libs/json-api/json-api-nestjs-sdk/src/lib/types';

export const axiosAdapter = adapterForAxios(axios);
let saveApp: INestApplication;

export const port = 3000;
export const globalPrefix = 'api';
export const run = async () => {
  if (saveApp) return saveApp;
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication({
    bufferLogs: true,
    logger: false,
  });
  app.useLogger(app.get(Logger));
  // const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(globalPrefix);
  await app.init();
  await app.listen(port);

  saveApp = app;
  return app;
};

export const creatSdk = (config: Partial<JsonConfig> = {}) =>
  JsonApiJs(
    {
      adapter: axiosAdapter,
      apiHost: `http://localhost:${port}`,
      apiPrefix: globalPrefix,
      dateFields: ['createdAt', 'updatedAt'],
      operationUrl: 'operation',
      ...config,
    },
    true
  );
