import {
  getDataSourceToken,
  getRepositoryToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Provider } from '@nestjs/common';
import {
  CONTROLLER_OPTIONS_TOKEN,
  MODULE_OPTIONS_TOKEN,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY_PAGE,
  JsonApiTransformerService,
  Query,
} from '@klerick/json-api-nestjs';
import { QueryField } from '@klerick/json-api-nestjs-shared';

import { PGliteDriver, getPGliteInstance } from 'typeorm-pglite';
import { DataSource, Repository } from 'typeorm';

import { DEFAULT_CONNECTION_NAME } from '../constants';
import {
  Addresses,
  Comments,
  Notes,
  Roles,
  UserGroups,
  Users,
  Pods,
  Entities,
} from './entities';
import {
  CurrentDataSourceProvider,
  CurrentEntityManager,
  CurrentEntityRepository,
  OrmServiceFactory,
} from '../factory';

let pGliteDriver: PGliteDriver;

export { Addresses, Comments, Notes, Roles, UserGroups, Users, Pods, Entities };

export { pullAllData } from './pull-data';

export async function sharedConnect(): Promise<PGliteDriver> {
  if (pGliteDriver) {
    return pGliteDriver;
  }
  // @ts-ignore
  pGliteDriver = await import('@electric-sql/pglite/contrib/uuid_ossp').then(
    ({ uuid_ossp }) =>
      new PGliteDriver({
        extensions: { uuid_ossp },
      })
  );

  return pGliteDriver;
}

const readOnlyDbName = `readonly_db_${Date.now()}`;

export function dbRandomName(readOnly = false) {
  if (readOnly) {
    return readOnlyDbName;
  }
  return `test_db_${Date.now()}`;
}

export function mockDbPgLiteTestModule(dbName = `test_db_${Date.now()}`) {
  return TypeOrmModule.forRootAsync({
    async useFactory() {
      const pgDriver = await sharedConnect();
      const synchronize = await initDb(pgDriver, dbName);

      return {
        type: 'postgres',
        driver: pgDriver.driver,
        logging: false,
        synchronize,
        entities: Entities,
      };
    },
  });
}

export async function initDb(pGliteDriver: PGliteDriver, testDbName: string) {
  const pgLite = await getPGliteInstance();
  const result = await pgLite.query(
    `select 1 from pg_database where datname = '${testDbName}'`
  );

  if ((result['rows'] as []).length === 0) {
    await pgLite.query(`create database ${testDbName}`);
  }

  return (result['rows'] as []).length === 0;
}

export function providerEntities(): Provider[] {
  return Entities.map((entitiy) => {
    return {
      provide: getRepositoryToken(entitiy, DEFAULT_CONNECTION_NAME),
      useFactory(dataSource: DataSource) {
        return dataSource.getRepository(entitiy);
      },
      inject: [getDataSourceToken()],
    };
  });
}

export async function getModuleForPgLite<E extends object>(
  entity: E,
  dbName = `test_db_${Date.now()}`,
  ...providers: Provider[]
): Promise<TestingModule> {
  const dbModule = await mockDbPgLiteTestModule(dbName);

  return await Test.createTestingModule({
    imports: [dbModule],
    providers: [
      ...providerEntities(),
      CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
      CurrentEntityManager(),
      CurrentEntityRepository(entity),
      OrmServiceFactory(),
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
        provide: CONTROLLER_OPTIONS_TOKEN,
        useValue: {
          requiredSelectField: false,
          debug: false,
        },
      },
      {
        provide: MODULE_OPTIONS_TOKEN,
        useValue: {
          requiredSelectField: false,
          debug: false,
        },
      },
      ...providers,
    ],
  }).compile();
}

export function getRepository(module: TestingModule) {
  const userRepository = module.get<Repository<Users>>(
    getRepositoryToken(Users, DEFAULT_CONNECTION_NAME)
  );

  const addressesRepository = module.get<Repository<Addresses>>(
    getRepositoryToken(Addresses, DEFAULT_CONNECTION_NAME)
  );

  const notesRepository = module.get<Repository<Notes>>(
    getRepositoryToken(Notes, DEFAULT_CONNECTION_NAME)
  );

  const commentsRepository = module.get<Repository<Comments>>(
    getRepositoryToken(Comments, DEFAULT_CONNECTION_NAME)
  );
  const rolesRepository = module.get<Repository<Roles>>(
    getRepositoryToken(Roles, DEFAULT_CONNECTION_NAME)
  );

  const userGroupRepository = module.get<Repository<UserGroups>>(
    getRepositoryToken(UserGroups, DEFAULT_CONNECTION_NAME)
  );

  const podsRepository = module.get<Repository<Pods>>(
    getRepositoryToken(Pods, DEFAULT_CONNECTION_NAME)
  );

  return {
    userRepository,
    addressesRepository,
    notesRepository,
    commentsRepository,
    rolesRepository,
    userGroupRepository,
    podsRepository,
  };
}

export function getDefaultQuery<
  R extends object,
  IdKey extends string = 'id'
>(): Query<R, IdKey> {
  const filter = {
    relation: null,
    target: null,
  };
  return {
    [QueryField.filter]: filter,
    [QueryField.fields]: null,
    [QueryField.include]: null,
    [QueryField.sort]: null,
    [QueryField.page]: {
      size: DEFAULT_PAGE_SIZE,
      number: DEFAULT_QUERY_PAGE,
    },
  } as Query<R, IdKey>;
}
