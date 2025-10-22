import { Test, TestingModule } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { QueryField } from '@klerick/json-api-nestjs-shared';
import {
  Query,
  CURRENT_ENTITY,
  MODULE_OPTIONS_TOKEN,
  JsonApiTransformerService,
} from '@klerick/json-api-nestjs';

import {
  Addresses,
  Comments,
  Notes,
  Roles,
  UserGroups,
  Users,
} from './entities';

import {
  CurrentEntityManager,
  CurrentEntityMetadata,
  CurrentEntityRepository,
  CurrentMicroOrmProvider,
  OrmServiceFactory,
  EntityPropsMap,
} from '../factory';
import { MicroOrmUtilService } from '../service';

export * from './entities';
export * from './utils';

import { initMikroOrm, pullAllData } from './utils';
import { DEFAULT_ARRAY_TYPE } from '../constants';

export const entities = [Users, UserGroups, Roles, Comments, Addresses, Notes];

export function mockDbPgLiteTestModule(dbName = `test_db_${Date.now()}`) {
  const mikroORM = {
    provide: MikroORM,
    useFactory: () => initMikroOrm(dbName),
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

export function getModuleForPgLite<E extends object>(
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
        provide: JsonApiTransformerService,
        useValue: {
          transformData() {
            return {
              included: {},
              data: {},
            };
          },
          transformRel() {
            return [];
          },
        },
      },
      {
        provide: CURRENT_ENTITY,
        useValue: entity,
      },
      OrmServiceFactory(),
      EntityPropsMap(entities as any),
      {
        provide: MODULE_OPTIONS_TOKEN,
        useValue: { options: { arrayType: DEFAULT_ARRAY_TYPE } },
      },
    ],
  }).compile();
}

export function getDefaultQuery<
  R extends object,
  IdKey extends string = 'id'
>(): Query<R, IdKey> {
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
  } as Query<R, IdKey>;
}
