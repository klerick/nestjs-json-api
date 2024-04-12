import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { DatabaseModule } from 'database';
import { ResourcesModule } from './resources/resources.module';
import { RpcModule } from './rpc/rpc.module';
import * as process from 'process';

@Module({
  imports: [
    DatabaseModule,
    ResourcesModule,
    RpcModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['NODE_ENV'] === 'test' ? 'silent' : 'debug',
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
