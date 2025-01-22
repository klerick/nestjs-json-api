import { DynamicModule, ParseIntPipe } from '@nestjs/common';

import {
  AnyEntity,
  ConfigParam,
  EntityName,
  ModuleOptions,
  RequiredFromPartial,
  ResultModuleOptions,
} from '../types';
import {
  DEFAULT_CONNECTION_NAME,
  JSON_API_DECORATOR_ENTITY,
} from '../constants';
import {
  MicroOrmParam,
  TypeOrmParam,
  MicroOrmModule,
  TypeOrmModule,
  AtomicOperationModule,
} from '../modules';
import { MixinModule } from '../modules/mixin/mixin.module';
import { Type } from '@nestjs/common/interfaces';
import { RouterModule } from '@nestjs/core';

export function prepareConfig(
  moduleOptions: ModuleOptions
): ResultModuleOptions {
  const { options: inputOptions } = moduleOptions;

  let resulOptions:
    | RequiredFromPartial<TypeOrmParam & ConfigParam>
    | RequiredFromPartial<MicroOrmParam & ConfigParam>;
  let resulType: typeof TypeOrmModule | typeof MicroOrmModule;
  const configParam: RequiredFromPartial<ConfigParam> = {
    debug: !!inputOptions.debug,
    requiredSelectField: !!inputOptions.requiredSelectField,
    operationUrl: inputOptions.operationUrl || false,
    overrideRoute: inputOptions.overrideRoute || false,
    pipeForId: inputOptions.pipeForId || ParseIntPipe,
  };

  moduleOptions.type = moduleOptions.type || TypeOrmModule;

  if (moduleOptions.type === TypeOrmModule) {
    const { runInTransaction, useSoftDelete } =
      moduleOptions.options as Partial<ConfigParam & TypeOrmParam>;

    resulType = TypeOrmModule;
    resulOptions = {
      ...configParam,
      useSoftDelete: useSoftDelete ? useSoftDelete : false,
      runInTransaction: runInTransaction ? runInTransaction : false,
    } as ConfigParam & RequiredFromPartial<TypeOrmParam>;
  } else {
    resulType = MicroOrmModule;
    resulOptions = {
      ...configParam,
    };
  }

  return {
    connectionName: moduleOptions.connectionName || DEFAULT_CONNECTION_NAME,
    entities: moduleOptions.entities,
    imports: moduleOptions.imports || [],
    providers: moduleOptions.providers || [],
    controllers: moduleOptions.controllers || [],
    type: resulType,
    options: resulOptions,
  } satisfies ResultModuleOptions;
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
