import { DynamicModule, Module } from '@nestjs/common';

import { JsonApiNestJsCommonModule } from './json-api-nestjs-common.module';
import {
  DEFAULT_CONNECTION_NAME,
  JSON_API_DECORATOR_ENTITY,
  ConfigParamDefault,
} from '../lib/constants';
import { BaseModuleClass } from '../lib/mixin';
import { ModuleOptions } from '../lib/types';

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

    const entityImport = options.entities.map((entity) => {
      const controller = (options.controllers || []).find(
        (item) =>
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
        ...module.imports,
        JsonApiNestJsCommonModule.forRoot(options),
      ];
      return module;
    });

    return {
      module: JsonApiModule,
      imports: [...entityImport],
    };
  }
}
