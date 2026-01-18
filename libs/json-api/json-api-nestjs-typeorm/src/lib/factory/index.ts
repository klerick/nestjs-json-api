import { FactoryProvider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import {
  EntityParam,
  CheckRelationName,
  FindOneRowEntity,
  RunInTransaction,
  PrepareParams,
  FIND_ONE_ROW_ENTITY,
  CHECK_RELATION_NAME,
  RUN_IN_TRANSACTION_FUNCTION,
  ORM_SERVICE,
  MODULE_OPTIONS_TOKEN,
  ENTITY_PARAM_MAP,
} from '@klerick/json-api-nestjs';
import { getEntityName } from '@klerick/json-api-nestjs-shared';

import { kebabCase } from 'change-case-commonjs';
import { DataSource, EntityManager, EntityTarget, Repository } from 'typeorm';

import {
  CURRENT_DATA_SOURCE_TOKEN,
  CURRENT_ENTITY_MANAGER_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
} from '../constants';

import { TypeOrmService, TypeormUtilsService } from '../service';

import { TypeOrmParam } from '../type';

import {
  getProps,
  getRelation,
  getPropsType,
  getPropsNullable,
  getPrimaryColumnName,
  getPrimaryColumnType,
  getRelationProperty,
  getArrayType,
  getRelationFkField,
} from '../orm-helper';
import { EntityClass } from '@mikro-orm/core';

export function CurrentDataSourceProvider(
  connectionName?: string
): FactoryProvider<DataSource> {
  return {
    provide: CURRENT_DATA_SOURCE_TOKEN,
    useFactory: (dataSource: DataSource) => dataSource,
    inject: [getDataSourceToken(connectionName)],
  };
}

export function CurrentEntityManager(): FactoryProvider<EntityManager> {
  return {
    provide: CURRENT_ENTITY_MANAGER_TOKEN,
    useFactory: (dataSource: DataSource) => dataSource.manager,
    inject: [CURRENT_DATA_SOURCE_TOKEN],
  };
}

export function CurrentEntityRepository<E extends object>(
  entity: E
): FactoryProvider<Repository<E>> {
  return {
    provide: CURRENT_ENTITY_REPOSITORY,
    useFactory: (entityManager: EntityManager) =>
      entityManager.getRepository(entity as unknown as EntityTarget<E>),
    inject: [CURRENT_ENTITY_MANAGER_TOKEN],
  };
}

export function EntityPropsMap<E extends object>(entities: EntityClass<E>[]) {
  return {
    provide: ENTITY_PARAM_MAP,
    inject: [CURRENT_ENTITY_MANAGER_TOKEN],
    useFactory: (entityManager: EntityManager) => {
      const mapProperty = new Map<EntityClass<E>, EntityParam<E>>();

      for (const item of entities) {
        const entityRepo = entityManager.getRepository<E>(item);

        const className = getEntityName(item);
        mapProperty.set(item, {
          props: getProps(entityRepo),
          propsType: getPropsType(entityRepo),
          propsNullable: getPropsNullable(entityRepo),
          primaryColumnName: getPrimaryColumnName(entityRepo),
          primaryColumnType: getPrimaryColumnType(entityRepo),
          propsArrayType: getArrayType(entityRepo),
          typeName: kebabCase(className),
          className: className,
          relations: getRelation(entityRepo),
          relationProperty: getRelationProperty(entityRepo),
          relationFkField: getRelationFkField(entityRepo),
        });
      }
      return mapProperty;
    },
  };
}

export function FindOneRowEntityFactory<E extends object>(): FactoryProvider<
  FindOneRowEntity<E>
> {
  return {
    provide: FIND_ONE_ROW_ENTITY,
    inject: [CURRENT_ENTITY_REPOSITORY, TypeormUtilsService],
    useFactory: (
      repository: Repository<E>,
      typeormUtilsService: TypeormUtilsService<E>
    ) => {
      return async (entity, value) => {
        const params = 'params';
        return await repository
          .createQueryBuilder(typeormUtilsService.currentAlias)
          .where(
            `${typeormUtilsService.getAliasPath(
              typeormUtilsService.currentPrimaryColumn
            )} = :${params}`
          )
          .setParameters({
            [params]: value,
          })
          .getOne();
      };
    },
  };
}

export function CheckRelationNameFactory<
  E extends object,
  IdKey extends string = 'id'
>(): FactoryProvider<CheckRelationName<E>> {
  return {
    provide: CHECK_RELATION_NAME,
    inject: [TypeormUtilsService],
    useFactory(typeormUtilsService: TypeormUtilsService<E, IdKey>) {
      return (entity, value) =>
        !!(typeormUtilsService.relationFields as any).find(
          (i: any) => i === value
        );
    },
  };
}

export function RunInTransactionFactory(): FactoryProvider<RunInTransaction> {
  return {
    provide: RUN_IN_TRANSACTION_FUNCTION,
    inject: [MODULE_OPTIONS_TOKEN, CURRENT_DATA_SOURCE_TOKEN],
    useFactory(options: PrepareParams<TypeOrmParam>, dataSource: DataSource) {
      const {
        options: { runInTransaction },
      } = options;

      if (runInTransaction && typeof runInTransaction === 'function') {
        return (callback) =>
          runInTransaction('READ COMMITTED', () => callback());
      }

      return async (callback) => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.startTransaction('READ UNCOMMITTED');
        let result: unknown;
        try {
          result = await callback();
          await queryRunner.commitTransaction();
        } catch (e) {
          await queryRunner.rollbackTransaction();
          throw e;
        } finally {
          await queryRunner.release();
        }
        return result;
      };
    },
  };
}

export function OrmServiceFactory() {
  return {
    provide: ORM_SERVICE,
    useClass: TypeOrmService,
  };
}
