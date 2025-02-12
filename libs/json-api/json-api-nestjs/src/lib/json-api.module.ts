import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import {
  AnyEntity,
  EntityName,
  TypeOrmDefaultOptions,
  TypeOrmOptions,
  MicroOrmOptions,
  ResultModuleOptions,
} from './types';
import { createMixinModule, prepareConfig, createAtomicModule } from './utils';
import type { TypeOrmJsonApiModule, MicroOrmJsonApiModule } from './modules';

@Module({})
export class JsonApiModule {
  public static forRoot(
    module: typeof TypeOrmJsonApiModule,
    options: TypeOrmOptions
  ): DynamicModule;
  public static forRoot(
    module: typeof MicroOrmJsonApiModule,
    options: MicroOrmOptions
  ): DynamicModule;
  /**
   * @deprecated This type of method is deprecated and may be removed in future versions.
   * Consider using newer alternatives or updated patterns for module registration.
   */
  public static forRoot(options: TypeOrmDefaultOptions): DynamicModule;
  public static forRoot(
    first:
      | typeof TypeOrmJsonApiModule
      | typeof MicroOrmJsonApiModule
      | TypeOrmDefaultOptions,
    second?: TypeOrmOptions | MicroOrmOptions
  ): DynamicModule {
    let resultOption: ResultModuleOptions = {} as any;

    if (second) {
      const module = first as
        | typeof TypeOrmJsonApiModule
        | typeof MicroOrmJsonApiModule;
      resultOption = {
        ...prepareConfig(second, module.module),
        type: module,
      } as ResultModuleOptions;
    } else {
      const {
        TypeOrmJsonApiModule,
      } = require('./modules/type-orm/type-orm-json-api.module');
      resultOption = {
        ...prepareConfig(
          first as TypeOrmDefaultOptions,
          TypeOrmJsonApiModule.module
        ),
        type: TypeOrmJsonApiModule as typeof TypeOrmJsonApiModule,
      } as any;
    }

    resultOption.imports.unshift(DiscoveryModule);

    const commonOrmModule = resultOption.type.forRoot(resultOption);

    const entitiesMixinModules = resultOption.entities.map(
      (entity: EntityName<AnyEntity>) =>
        createMixinModule(entity, resultOption, commonOrmModule)
    );

    const operationModuleImport = createAtomicModule(
      resultOption,
      entitiesMixinModules,
      commonOrmModule
    );

    return {
      module: JsonApiModule,
      imports: [...operationModuleImport, ...entitiesMixinModules],
    };
  }
}
