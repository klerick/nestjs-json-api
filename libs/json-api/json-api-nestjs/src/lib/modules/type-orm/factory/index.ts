import { FactoryProvider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { camelToKebab } from '@klerick/json-api-nestjs-shared';
import { DataSource, EntityManager, Repository } from 'typeorm';

import {
  CURRENT_ENTITY_MANAGER_TOKEN,
  FIND_ONE_ROW_ENTITY,
  CHECK_RELATION_NAME,
  ORM_SERVICE,
  RUN_IN_TRANSACTION_FUNCTION,
  GLOBAL_MODULE_OPTIONS_TOKEN,
  CURRENT_DATA_SOURCE_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
  ENTITY_MAP_PROPS,
} from '../../../constants';
import {
  FindOneRowEntity,
  CheckRelationNme,
  ZodEntityProps,
} from '../../mixin/types';
import {
  ObjectLiteral,
  EntityTarget,
  ResultGeneralParam,
  RequiredFromPartial,
  ConfigParam,
  RunInTransaction,
  EntityClass,
} from '../../../types';

import { TypeOrmService, TypeormUtilsService } from '../service';
import { getEntityName } from '../../mixin/helper';
import { TypeOrmJsonApiModule } from '../type-orm-json-api.module';
import { TypeOrmParam } from '../type';

import {
  getProps,
  getRelation,
  getPropsType,
  getPropsNullable,
  getPrimaryColumnName,
  getPrimaryColumnType,
  getRelationProperty,
} from '../orm-helper';

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

export function EntityPropsMap<E extends ObjectLiteral>(
  entities: EntityClass<E>[]
) {
  return {
    provide: ENTITY_MAP_PROPS,
    inject: [CURRENT_ENTITY_MANAGER_TOKEN],
    useFactory: (entityManager: EntityManager) => {
      const mapProperty = new Map<EntityClass<E>, ZodEntityProps<E>>();

      for (const item of entities) {
        const entityRepo = entityManager.getRepository<E>(item);

        const className = getEntityName(item);
        mapProperty.set(item, {
          props: getProps(entityRepo),
          propsType: getPropsType(entityRepo),
          propsNullable: getPropsNullable(entityRepo),
          primaryColumnName: getPrimaryColumnName(entityRepo),
          primaryColumnType: getPrimaryColumnType(entityRepo),
          typeName: camelToKebab(className),
          className: className,
          relations: getRelation(entityRepo),
          relationProperty: getRelationProperty(entityRepo),
        });
      }
      return mapProperty;
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
        type: typeof TypeOrmJsonApiModule;
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
