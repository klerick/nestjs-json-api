import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import config from './config';
import { Addresses, Comments, Roles, Users, RequestsHavePodLocks, Pods, Requests } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...config as any,
      ...{entities: [Comments, Addresses, Roles, Users,
          RequestsHavePodLocks,
          Pods, Requests]},
    }),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
