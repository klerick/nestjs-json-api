import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule, RouterModule } from '@nestjs/core';
import { ConfigParamDefault, DEFAULT_CONNECTION_NAME } from './constants';
import { ModuleOptions } from './types';
import { JsonApiNestJsCommonModule } from './json-api-nestjs-common.module';
import { JSON_API_DECORATOR_ENTITY } from './constants';
import { BaseModuleClass } from './mixin';
import { AtomicOperationModule } from './modules/atomic-operation/atomic-operation.module';

@Module({})
export class JsonApiModule {
  private static connectionName = DEFAULT_CONNECTION_NAME;

  public static forRoot(options: ModuleOptions): DynamicModule {
    JsonApiModule.connectionName =
      options.connectionName || JsonApiModule.connectionName;

    options.connectionName = JsonApiModule.connectionName;
    options.options = {
      ...ConfigParamDefault,
      ...options.options,
    };

    const commonModule = JsonApiNestJsCommonModule.forRoot(options);

    const entityImport = options.entities.map((entity) => {
      const controller = (options.controllers || []).find(
        (item) =>
          item &&
          Reflect.getMetadata(JSON_API_DECORATOR_ENTITY, item) === entity
      );
      const module = BaseModuleClass.forRoot({
        entity,
        connectionName: JsonApiModule.connectionName,
        controller,
        config: {
          ...ConfigParamDefault,
          ...options.options,
        },
      });
      module.imports = [
        DiscoveryModule,
        commonModule,
        ...(module.imports || []),
      ];
      return module;
    });

    const operationModuleImport = options.options?.operationUrl
      ? [
          AtomicOperationModule.forRoot(
            {
              ...options,
              connectionName: JsonApiModule.connectionName,
            },
            entityImport,
            commonModule
          ),
          RouterModule.register([
            {
              module: AtomicOperationModule,
              path: options.options.operationUrl,
            },
          ]),
        ]
      : [];

    return {
      module: JsonApiModule,
      imports: [...operationModuleImport, ...entityImport],
    };
  }
}
