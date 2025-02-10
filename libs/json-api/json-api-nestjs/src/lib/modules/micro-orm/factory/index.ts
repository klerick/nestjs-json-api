import { FactoryProvider } from '@nestjs/common';
import {
  EntityManager,
  MikroORM,
  EntityRepository,
  MetadataStorage,
} from '@mikro-orm/core';
import { camelToKebab } from '@klerick/json-api-nestjs-shared';
import { getMikroORMToken } from '@mikro-orm/nestjs';

import {
  CURRENT_DATA_SOURCE_TOKEN,
  CURRENT_ENTITY_MANAGER_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
  FIELD_FOR_ENTITY,
  GLOBAL_MODULE_OPTIONS_TOKEN,
  RUN_IN_TRANSACTION_FUNCTION,
  ORM_SERVICE,
  ENTITY_MAP_PROPS,
} from '../../../constants';

import {
  EntityClass,
  EntityTarget,
  ObjectLiteral,
  ResultMicroOrmModuleOptions,
  RunInTransaction,
} from '../../../types';
import { GetFieldForEntity, ZodEntityProps } from '../../mixin/types';
import {
  getProps,
  getRelation,
  getPropsType,
  getPropsNullable,
  getPrimaryColumnName,
  getPrimaryColumnType,
  getRelationProperty,
} from '../orm-helper';

import { getEntityName } from '../../mixin/helper';
import { ENTITY_METADATA_TOKEN } from '../constants';
import { MicroOrmService } from '../service';

export function CurrentMicroOrmProvider(
  connectionName?: string
): FactoryProvider<MikroORM> {
  return {
    provide: CURRENT_DATA_SOURCE_TOKEN,
    useFactory: (mikroORM: MikroORM) => {
      return mikroORM;
    },
    inject: [connectionName ? getMikroORMToken(connectionName) : MikroORM],
  };
}

export function CurrentEntityManager(): FactoryProvider<EntityManager> {
  return {
    provide: CURRENT_ENTITY_MANAGER_TOKEN,
    useFactory: (mikroORM: MikroORM) => mikroORM.em,
    inject: [CURRENT_DATA_SOURCE_TOKEN],
  };
}

export function CurrentEntityRepository<E extends ObjectLiteral>(
  entity: E
): FactoryProvider<EntityRepository<E>> {
  return {
    provide: CURRENT_ENTITY_REPOSITORY,
    useFactory: (entityManager: EntityManager) =>
      entityManager.getRepository(entity as unknown as EntityClass<E>),
    inject: [CURRENT_ENTITY_MANAGER_TOKEN],
  };
}

export function CurrentEntityMetadata(): FactoryProvider<MetadataStorage> {
  return {
    provide: ENTITY_METADATA_TOKEN,
    useFactory: (mikroORM: MikroORM) => mikroORM.getMetadata(),
    inject: [CURRENT_DATA_SOURCE_TOKEN],
  };
}

export function EntityPropsMap<E extends ObjectLiteral>(
  entities: EntityClass<E>[]
) {
  return {
    provide: ENTITY_MAP_PROPS,
    inject: [ENTITY_METADATA_TOKEN, GLOBAL_MODULE_OPTIONS_TOKEN],
    useFactory: (
      metadataStorage: MetadataStorage,
      config: ResultMicroOrmModuleOptions
    ) => {
      const mapProperty = new Map<EntityClass<E>, ZodEntityProps<E>>();
      const arrayConfig = config.options.arrayType;
      for (const item of entities) {
        const metadata = metadataStorage.get<E>(item);
        const className = getEntityName(item);
        mapProperty.set(item, {
          props: getProps(metadata),
          propsType: getPropsType(metadata, arrayConfig),
          propsNullable: getPropsNullable(metadata),
          primaryColumnName: getPrimaryColumnName(metadata),
          primaryColumnType: getPrimaryColumnType(metadata),
          typeName: camelToKebab(className),
          className: className,
          relations: getRelation(metadata),
          relationProperty: getRelationProperty(metadata),
        });
      }
      return mapProperty;
    },
  };
}

export function RunInTransactionFactory(): FactoryProvider<RunInTransaction> {
  return {
    provide: RUN_IN_TRANSACTION_FUNCTION,
    inject: [],
    useFactory() {
      return async (callback) => {};
    },
  };
}

export function OrmServiceFactory() {
  return {
    provide: ORM_SERVICE,
    useClass: MicroOrmService,
  };
}
