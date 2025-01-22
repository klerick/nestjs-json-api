import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { AnyEntity, EntityName, ModuleOptions } from './types';
import { createMixinModule, prepareConfig, createAtomicModule } from './utils';

@Module({})
export class JsonApiModule {
  public static forRoot(options: ModuleOptions): DynamicModule {
    const resultOption = prepareConfig(options);

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
