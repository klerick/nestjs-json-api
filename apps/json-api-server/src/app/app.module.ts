import { Module } from '@nestjs/common';
import { LoggerErrorInterceptor, LoggerModule } from 'nestjs-pino';
import { ClsModule, ClsServiceManager } from 'nestjs-cls';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { RpcModule } from './rpc/rpc.module';

import {JsonApiTypeOrm, JsonApiMicroOrm} from './json-api'

const jsonAPiModule =
  process.env['ORM_TYPE'] === 'typeorm'
    ? JsonApiTypeOrm
    : JsonApiMicroOrm;


@Module({
  imports: [
    jsonAPiModule,
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true, generateId: true },
    }),
    RpcModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['NODE_ENV'] === 'test' ? 'silent' : 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'UTC:mm/dd/yyyy, h:MM:ss TT Z',
            levelFirst: true,
            colorize: true,
            messageFormat: `{service} - {if context}[{context}]{end} {msg} {if requestId}({requestId}){end}`,
            ignore: `hostname,service,context,message,requestId`,
          },
        },
        genReqId: function (req, res) {
          const cls = ClsServiceManager.getClsService();
          const existingID = cls.getId()
          res.setHeader('X-Request-Id', existingID)
          return existingID
        },
        customProps: () => {
          const cls = ClsServiceManager.getClsService();
          const contextId = cls.getId();
          if (!contextId) {
            return {};
          }
          return {
            ['requestId']: contextId,
          };
        }
      },
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerErrorInterceptor,
    },
  ],
})
export class AppModule {}
