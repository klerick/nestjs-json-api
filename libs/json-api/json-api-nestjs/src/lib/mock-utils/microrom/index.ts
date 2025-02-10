import { DynamicModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { QueryField } from '@klerick/json-api-nestjs-shared';

import { IMemoryDb } from 'pg-mem';

import {
  Addresses,
  Comments,
  Notes,
  Roles,
  UserGroups,
  Users,
} from './entities';
import { ObjectLiteral } from '../../types';
import { Query } from '../../modules/mixin/zod';

import {
  CurrentEntityManager,
  CurrentEntityMetadata,
  CurrentEntityRepository,
  CurrentMicroOrmProvider,
  OrmServiceFactory,
  EntityPropsMap,
} from '../../modules/micro-orm/factory';
import { MicroOrmUtilService } from '../../modules/micro-orm/service/micro-orm-util.service';
import { CURRENT_ENTITY, GLOBAL_MODULE_OPTIONS_TOKEN } from '../../constants';

export * from './entities';
export * from './utils';

export const entities = [Users, UserGroups, Roles, Comments, Addresses, Notes];

import { sharedConnect, initMikroOrm, pullAllData } from './utils';
import { DEFAULT_ARRAY_TYPE } from '../../modules/micro-orm/constants';
import { JsonApiTransformerService } from '../../modules/mixin/service/json-api-transformer.service';

export function mockDbPgLiteTestModule(dbName = `test_db_${Date.now()}`) {
  const mikroORM = {
    provide: MikroORM,
    useFactory: async () => {
      const knexInst = await sharedConnect();
      return initMikroOrm(knexInst, dbName);
    },
  };
  return {
    module: MikroOrmModule,
    providers: [mikroORM],
    exports: [mikroORM],
  };
}

export function mockDBTestModule(db: IMemoryDb): DynamicModule {
  const mikroORM = {
    provide: MikroORM,
    useFactory: () =>
      db.adapters.createMikroOrm({
        highlighter: new SqlHighlighter(),
        entities: [Users, UserGroups, Roles, Comments, Addresses, Notes],
        driver: PostgreSqlDriver,
        allowGlobalContext: true,
        debug: ['query', 'query-params'],
      }),
  };
  return {
    module: MikroOrmModule,
    providers: [mikroORM],
    exports: [mikroORM],
  };
}
const readOnlyDbName = `readonly_db_${Date.now()}`;

export function dbRandomName(readOnly = false) {
  if (readOnly) {
    return readOnlyDbName;
  }
  return `test_db_${Date.now()}`;
}

export async function pullData(em: EntityManager, count = 1) {
  for (let i = 0; i < count; i++) {
    await pullAllData(em);
  }
}

export function getModuleForPgLite<E extends ObjectLiteral>(
  entity: E,
  dbName = `test_db_${Date.now()}`
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [mockDbPgLiteTestModule(dbName)],
    providers: [
      CurrentMicroOrmProvider(),
      CurrentEntityManager(),
      CurrentEntityMetadata(),
      CurrentEntityRepository(entity),
      MicroOrmUtilService,
      {
        provide: CURRENT_ENTITY,
        useValue: entity,
      },
      OrmServiceFactory(),
      EntityPropsMap(entities as any),
      {
        provide: GLOBAL_MODULE_OPTIONS_TOKEN,
        useValue: { options: { arrayType: DEFAULT_ARRAY_TYPE } },
      },
      JsonApiTransformerService,
    ],
  }).compile();
}

export function getModuleFor<E extends ObjectLiteral>(
  db: IMemoryDb,
  entity: E
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [mockDBTestModule(db)],
    providers: [
      CurrentMicroOrmProvider(),
      CurrentEntityManager(),
      CurrentEntityMetadata(),
      CurrentEntityRepository(entity),
      MicroOrmUtilService,
      {
        provide: CURRENT_ENTITY,
        useValue: entity,
      },
      OrmServiceFactory(),
    ],
  }).compile();
}

export function getDefaultQuery<R extends ObjectLiteral>(): Query<R> {
  return {
    [QueryField.filter]: {
      relation: null,
      target: null,
    },
    [QueryField.fields]: null,
    [QueryField.include]: null,
    [QueryField.sort]: null,
    [QueryField.page]: {
      size: 1,
      number: 1,
    },
  } satisfies Query<R>;
}
