import { DynamicModule } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import { IMemoryDb } from 'pg-mem';

import {
  Addresses,
  Comments,
  Notes,
  Roles,
  UserGroups,
  Users,
} from './entities';

export * from './entities';
export * from './utils';

export const entities = [Users, UserGroups, Roles, Comments, Addresses, Notes];

export function mockDBTestModule(db: IMemoryDb): DynamicModule {
  const mikroORM = {
    provide: MikroORM,
    useFactory: () =>
      db.adapters.createMikroOrm({
        entities: [Users, UserGroups, Roles, Comments, Addresses, Notes],
        driver: PostgreSqlDriver,
        allowGlobalContext: true,
      }),
  };
  return {
    module: MikroOrmModule,
    providers: [mikroORM],
    exports: [mikroORM],
  };
}
