import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { TypeOrmDatabaseModule } from '@nestjs-json-api/typeorm-database';
import { MicroOrmDatabaseModule } from '@nestjs-json-api/microorm-database';
import { ResourcesTypeModule } from './resources/type-orm/resources-type.module';
import { ResourcesMicroModule } from './resources/micro-orm/resources-micro.module';
import { RpcModule } from './rpc/rpc.module';

const ormModule =
  process.env['ORM_TYPE'] === 'typeorm'
    ? TypeOrmDatabaseModule
    : MicroOrmDatabaseModule;

const resourceModule =
  process.env['ORM_TYPE'] === 'typeorm'
    ? ResourcesTypeModule
    : ResourcesMicroModule;

@Module({
  imports: [
    ormModule,
    resourceModule,
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
