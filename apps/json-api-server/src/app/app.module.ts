import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { TypeOrmDatabaseModule } from '@nestjs-json-api/typeorm-database';
import { MicroOrmDatabaseModule } from '@nestjs-json-api/microorm-database';
import { ResourcesModule } from './resources/resources.module';
import { RpcModule } from './rpc/rpc.module';
import * as process from 'process';

const ormModule =
  process.env['ORM_TYPE'] === 'typeorm'
    ? TypeOrmDatabaseModule
    : MicroOrmDatabaseModule;

@Module({
  imports: [
    ormModule,
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
