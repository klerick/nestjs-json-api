import { FactoryProvider } from '@nestjs/common';
import {
  EntityManager,
  MikroORM,
  EntityRepository,
  MetadataStorage,
  EntityClass,
} from '@mikro-orm/core';
import { kebabCase } from 'change-case-commonjs';
import { getMikroORMToken } from '@mikro-orm/nestjs';

import {
  CheckRelationName,
  CHECK_RELATION_NAME,
  EntityParam,
  RunInTransaction,
  PrepareParams,
  RUN_IN_TRANSACTION_FUNCTION,
  ORM_SERVICE,
  MODULE_OPTIONS_TOKEN,
  ENTITY_PARAM_MAP,
  FIND_ONE_ROW_ENTITY,
  FindOneRowEntity,
} from '@klerick/json-api-nestjs';
import { getEntityName } from '@klerick/json-api-nestjs-shared';

import {
  getProps,
  getRelation,
  getPropsType,
  getPropsNullable,
  getPrimaryColumnName,
  getPrimaryColumnType,
  getRelationProperty,
  getArrayType,
} from '../orm-helper';

import {
  ENTITY_METADATA_TOKEN,
  CURRENT_DATA_SOURCE_TOKEN,
  CURRENT_ENTITY_MANAGER_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
} from '../constants';
import { MicroOrmService } from '../service';
import { MicroOrmParam } from '../type';
import { MicroOrmUtilService } from '../service/micro-orm-util.service';

export function CurrentMicroOrmProvider(
  connectionName?: string
): FactoryProvider<MikroORM> {
  return {
    provide: CURRENT_DATA_SOURCE_TOKEN,
    useFactory: (mikroORM: MikroORM) => mikroORM,
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

export function CurrentEntityRepository<E extends object>(
  entity: E
): FactoryProvider<EntityRepository<E>> {
  return {
    provide: CURRENT_ENTITY_REPOSITORY,
    useFactory: (entityManager: EntityManager) =>
      entityManager.getRepository<E>(entity as unknown as EntityClass<E>),
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

export function CheckRelationNameFactory<
  E extends object,
  IdKey extends string = 'id'
>(): FactoryProvider<CheckRelationName<E>> {
  return {
    provide: CHECK_RELATION_NAME,
    inject: [MicroOrmUtilService],
    useFactory(microOrmUtilService: MicroOrmUtilService<E, IdKey>) {
      return (entity, value) =>
        !!microOrmUtilService.relationsName.find((i: any) => i === value);
    },
  };
}

export function EntityPropsMap<E extends object>(entities: EntityClass<E>[]) {
  return {
    provide: ENTITY_PARAM_MAP,
    inject: [ENTITY_METADATA_TOKEN, MODULE_OPTIONS_TOKEN],
    useFactory: (
      metadataStorage: MetadataStorage,
      config: PrepareParams<MicroOrmParam>
    ) => {
      const mapProperty = new Map<EntityClass<E>, EntityParam<E>>();
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
          propsArrayType: getArrayType(metadata),
          typeName: kebabCase(className),
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
    inject: [CURRENT_ENTITY_MANAGER_TOKEN],
    useFactory(entityManager: EntityManager) {
      return (callback) =>
        entityManager.transactional(() => callback());
    },
  };
}

export function OrmServiceFactory() {
  return {
    provide: ORM_SERVICE,
    useClass: MicroOrmService,
  };
}
export function FindOneRowEntityFactory<
  E extends object,
  IdKey extends string
>(): FactoryProvider<FindOneRowEntity<E>> {
  return {
    provide: FIND_ONE_ROW_ENTITY,
    inject: [MicroOrmUtilService],
    useFactory(microOrmUtilService: MicroOrmUtilService<E, IdKey>) {
      return async (entity, value) => {
        const qb = microOrmUtilService.queryBuilder(entity).where({
          [microOrmUtilService.currentPrimaryColumn]: value,
        });
        await qb.applyFilters();
        return qb.getSingleResult();
      };
    },
  };
}
