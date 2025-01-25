import { DynamicModule, ParseIntPipe } from '@nestjs/common';

import {
  AnyEntity,
  ConfigParam,
  EntityName,
  MicroOrmOptions,
  RequiredFromPartial,
  ResultModuleOptions,
  TypeOrmConfigParam,
  MicroOrmConfigParam,
  TypeOrmOptions,
} from '../types';
import {
  DEFAULT_CONNECTION_NAME,
  JSON_API_DECORATOR_ENTITY,
} from '../constants';
import { TypeOrmParam, AtomicOperationModule, MicroOrmParam } from '../modules';
import { MixinModule } from '../modules/mixin/mixin.module';
import { Type } from '@nestjs/common/interfaces';
import { RouterModule } from '@nestjs/core';
import { DEFAULT_ARRAY_TYPE } from '../modules/micro-orm/constants';

export function prepareConfig(
  moduleOptions: TypeOrmOptions | MicroOrmOptions,
  type: 'typeOrm' | 'microOrm'
): Omit<ResultModuleOptions, 'type'> {
  const { options: inputOptions } = moduleOptions;

  let resulOptions:
    | RequiredFromPartial<TypeOrmConfigParam>
    | RequiredFromPartial<MicroOrmConfigParam>;

  const configParam: RequiredFromPartial<ConfigParam> = {
    debug: !!inputOptions.debug,
    requiredSelectField: !!inputOptions.requiredSelectField,
    operationUrl: inputOptions.operationUrl || false,
    overrideRoute: inputOptions.overrideRoute || false,
    pipeForId: inputOptions.pipeForId || ParseIntPipe,
  };

  if (type === 'typeOrm') {
    const { runInTransaction, useSoftDelete } =
      moduleOptions.options as Partial<ConfigParam & TypeOrmParam>;

    resulOptions = {
      ...configParam,
      useSoftDelete: useSoftDelete ? useSoftDelete : false,
      runInTransaction: runInTransaction ? runInTransaction : false,
    };
  } else {
    const { arrayType } = moduleOptions.options as Partial<
      ConfigParam & MicroOrmParam
    >;

    resulOptions = {
      ...configParam,
      arrayType: [...DEFAULT_ARRAY_TYPE, ...(arrayType || [])],
    };
  }

  return {
    connectionName:
      type === 'typeOrm'
        ? moduleOptions.connectionName || DEFAULT_CONNECTION_NAME
        : (moduleOptions.connectionName as any),
    entities: moduleOptions.entities,
    imports: moduleOptions.imports || [],
    providers: moduleOptions.providers || [],
    controllers: moduleOptions.controllers || [],
    options: resulOptions as any,
  } satisfies Omit<ResultModuleOptions, 'type'>;
}

export function createMixinModule(
  entity: EntityName<AnyEntity>,
  resultOption: ResultModuleOptions,
  commonOrmModule: DynamicModule
): DynamicModule {
  const controller = (resultOption.controllers || []).find(
    (item) =>
      item && Reflect.getMetadata(JSON_API_DECORATOR_ENTITY, item) === entity
  );

  return MixinModule.forRoot({
    entity,
    controller,
    config: resultOption.options,
    imports: [commonOrmModule, ...resultOption.imports],
    ormModule: resultOption.type,
  });
}

export function createAtomicModule(
  options: ResultModuleOptions,
  entitiesMixinModules: DynamicModule[],
  commonOrmModule: DynamicModule
): DynamicModule[] {
  const { operationUrl } = options.options;
  if (!operationUrl) return [];

  return [
    AtomicOperationModule.forRoot(
      {
        ...options,
        connectionName: options.connectionName,
      },
      entitiesMixinModules,
      commonOrmModule
    ),
    RouterModule.register([
      {
        module: AtomicOperationModule,
        path: operationUrl,
      },
    ]),
  ];
}

export function entityForClass<T = any>(type: Type<T>): EntityName<AnyEntity> {
  return Reflect.getMetadata(JSON_API_DECORATOR_ENTITY, type);
}
