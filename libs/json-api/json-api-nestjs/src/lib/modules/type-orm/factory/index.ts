import { FactoryProvider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { camelToKebab, ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { DataSource, EntityManager, Repository } from 'typeorm';

import {
  CURRENT_DATA_SOURCE_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
} from '../constants';
import {
  CURRENT_ENTITY_MANAGER_TOKEN,
  FIND_ONE_ROW_ENTITY,
  CHECK_RELATION_NAME,
  PARAMS_FOR_ZOD_SCHEMA,
  ORM_SERVICE,
  FIELD_FOR_ENTITY,
  RUN_IN_TRANSACTION_FUNCTION,
  GLOBAL_MODULE_OPTIONS_TOKEN,
} from '../../../constants';
import {
  EntityProps,
  FieldWithType,
  FindOneRowEntity,
  CheckRelationNme,
  ZodParams,
  GetFieldForEntity,
} from '../../mixin/types';
import {
  ObjectLiteral,
  EntityTarget,
  ResultGeneralParam,
  RequiredFromPartial,
  ConfigParam,
  RunInTransaction,
} from '../../../types';
import {
  getField,
  getPropsTreeForRepository,
  getArrayPropsForEntity,
  getTypeForAllProps,
  getRelationTypeArray,
  getTypePrimaryColumn,
  getFieldWithType,
  getPropsFromDb,
  getRelationTypeName,
  getRelationTypePrimaryColumn,
} from '../orm-helper';

import { TypeOrmService, TypeormUtilsService } from '../service';
import { getEntityName } from '../../mixin/helper';
import { TypeOrmModule } from '@klerick/json-api-nestjs';
import { TypeOrmParam } from '../type';

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

export function GetFieldForEntity<E extends ObjectLiteral>(): FactoryProvider<
  GetFieldForEntity<E>
> {
  return {
    provide: FIELD_FOR_ENTITY,
    useFactory: (entityManager: EntityManager) => {
      return (entity: EntityTarget<E>) =>
        getField(entityManager.getRepository(entity));
    },
    inject: [CURRENT_ENTITY_MANAGER_TOKEN],
  };
}

export function CurrentEntityRepository<E extends ObjectLiteral>(
  entity: E
): FactoryProvider<Repository<E>> {
  return {
    provide: CURRENT_ENTITY_REPOSITORY,
    useFactory: (entityManager: EntityManager) =>
      entityManager.getRepository(entity as unknown as EntityTarget<E>),
    inject: [CURRENT_ENTITY_MANAGER_TOKEN],
  };
}

export function ZodParamsFactory<E extends ObjectLiteral>(): FactoryProvider<
  ZodParams<E, EntityProps<E>>
> {
  return {
    provide: PARAMS_FOR_ZOD_SCHEMA,
    inject: [CURRENT_ENTITY_REPOSITORY],
    useFactory: (repo: Repository<E>) => {
      const primaryColumns = repo.metadata.primaryColumns[0]
        .propertyName as EntityProps<E>;
      const fieldWithType = ObjectTyped.entries(getFieldWithType(repo))
        .filter(([key]) => key !== repo.metadata.primaryColumns[0].propertyName)
        .reduce(
          (acum, [key, type]) => ({
            ...acum,
            [key]: type,
          }),
          {} as FieldWithType<E>
        );

      return {
        entityFieldsStructure: getField(repo),
        entityRelationStructure: getPropsTreeForRepository(repo),
        propsArray: getArrayPropsForEntity(repo),
        propsType: getTypeForAllProps(repo),
        typeId: getTypePrimaryColumn(repo),
        typeName: camelToKebab(getEntityName(repo.target)),
        fieldWithType,
        propsDb: getPropsFromDb(repo),
        primaryColumn: primaryColumns,
        relationArrayProps: getRelationTypeArray(repo),
        relationPopsName: getRelationTypeName(repo),
        primaryColumnType: getRelationTypePrimaryColumn(repo),
      } satisfies ZodParams<E, EntityProps<E>>;
    },
  };
}

export function FindOneRowEntityFactory<
  E extends ObjectLiteral
>(): FactoryProvider<FindOneRowEntity<E>> {
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
  E extends ObjectLiteral
>(): FactoryProvider<CheckRelationNme<E>> {
  return {
    provide: CHECK_RELATION_NAME,
    inject: [TypeormUtilsService],
    useFactory(typeormUtilsService: TypeormUtilsService<E>) {
      return (entity, value) =>
        !!typeormUtilsService.relationFields.find((i) => i === value);
    },
  };
}

export function RunInTransactionFactory(): FactoryProvider<RunInTransaction> {
  return {
    provide: RUN_IN_TRANSACTION_FUNCTION,
    inject: [GLOBAL_MODULE_OPTIONS_TOKEN, CURRENT_DATA_SOURCE_TOKEN],
    useFactory(
      options: ResultGeneralParam & {
        type: typeof TypeOrmModule;
        options: RequiredFromPartial<ConfigParam & TypeOrmParam>;
      },
      dataSource: DataSource
    ) {
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
