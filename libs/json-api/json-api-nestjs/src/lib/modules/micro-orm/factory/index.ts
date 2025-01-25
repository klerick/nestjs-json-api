import { FactoryProvider } from '@nestjs/common';
import {
  EntityManager,
  MikroORM,
  EntityRepository,
  EntityMetadata,
  MetadataStorage,
} from '@mikro-orm/core';
import { camelToKebab, ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { getMikroORMToken } from '@mikro-orm/nestjs';

import {
  CURRENT_DATA_SOURCE_TOKEN,
  CURRENT_ENTITY_MANAGER_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
  FIELD_FOR_ENTITY,
  GLOBAL_MODULE_OPTIONS_TOKEN,
  PARAMS_FOR_ZOD_SCHEMA,
  RUN_IN_TRANSACTION_FUNCTION,
  ORM_SERVICE,
} from '../../../constants';

import {
  ConfigParam,
  EntityClass,
  EntityName,
  EntityTarget,
  ObjectLiteral,
  RequiredFromPartial,
  ResultGeneralParam,
  ResultMicroOrmModuleOptions,
  RunInTransaction,
} from '../../../types';
import {
  EntityProps,
  FieldWithType,
  GetFieldForEntity,
  ZodParams,
} from '../../mixin/types';
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

import { getEntityName } from '../../mixin/helper';
import { ENTITY_METADATA_TOKEN } from '../constants';
import { MicroOrmService } from '../service';

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

export function GetFieldForEntity<E extends ObjectLiteral>(): FactoryProvider<
  GetFieldForEntity<E>
> {
  return {
    provide: FIELD_FOR_ENTITY,
    useFactory: (entityManager: EntityManager) => {
      return (entity: EntityTarget<E>) =>
        getField(entityManager.getMetadata().get(entity as EntityClass<E>));
    },
    inject: [CURRENT_ENTITY_MANAGER_TOKEN],
  };
}

export function ZodParamsFactory<E extends ObjectLiteral>(
  currentEntity: EntityClass<E>
): FactoryProvider<ZodParams<E, EntityProps<E>>> {
  return {
    provide: PARAMS_FOR_ZOD_SCHEMA,
    inject: [ENTITY_METADATA_TOKEN, GLOBAL_MODULE_OPTIONS_TOKEN],
    useFactory: (
      metadataStorage: MetadataStorage,
      config: ResultMicroOrmModuleOptions
    ) => {
      const metadata = metadataStorage.get<E>(currentEntity);
      const arrayConfig = config.options.arrayType;

      const primaryColumns = metadata.getPrimaryProp()
        .name as unknown as EntityProps<E>;

      const fieldWithType = ObjectTyped.entries(
        getFieldWithType(metadata, arrayConfig)
      )
        .filter(([key]) => key !== primaryColumns)
        .reduce(
          (acum, [key, type]) => ({
            ...acum,
            [key]: type,
          }),
          {} as FieldWithType<E>
        );

      return {
        entityFieldsStructure: getField(metadata),
        entityRelationStructure: getPropsTreeForRepository(
          metadataStorage,
          currentEntity
        ),
        propsArray: getArrayPropsForEntity<E>(
          metadataStorage,
          currentEntity,
          arrayConfig
        ),
        propsType: getTypeForAllProps<E>(
          metadataStorage,
          currentEntity,
          arrayConfig
        ),
        typeId: getTypePrimaryColumn(metadata),
        typeName: camelToKebab(getEntityName(currentEntity)),
        fieldWithType,
        propsDb: getPropsFromDb(metadata, arrayConfig),
        primaryColumn: primaryColumns,
        relationArrayProps: getRelationTypeArray(metadata),
        relationPopsName: getRelationTypeName(metadata),
        primaryColumnType: getRelationTypePrimaryColumn(
          metadataStorage,
          currentEntity
        ),
      } satisfies ZodParams<E, EntityProps<E>>;
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
