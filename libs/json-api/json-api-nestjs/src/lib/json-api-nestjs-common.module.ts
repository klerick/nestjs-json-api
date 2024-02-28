import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ModuleOptions } from './types';
import { GLOBAL_MODULE_OPTIONS_TOKEN } from './constants';
import { CurrentDataSourceProvider, SwaggerBindMethod } from './factory';
import { TransformInputService, EntityPropsMapService } from './service';

@Module({})
export class JsonApiNestJsCommonModule {
  static forRoot(options: ModuleOptions): DynamicModule {
    const optionProvider = {
      provide: GLOBAL_MODULE_OPTIONS_TOKEN,
      useValue: options,
    };

    const currentDataSourceProvider = CurrentDataSourceProvider(
      options.connectionName
    );

    const typeOrmModule = TypeOrmModule.forFeature(
      options.entities,
      options.connectionName
    );

    return {
      module: JsonApiNestJsCommonModule,
      imports: [typeOrmModule, ...(options.imports || [])],
      providers: [
        ...(options.providers || []),
        optionProvider,
        currentDataSourceProvider,
        TransformInputService,
        EntityPropsMapService,
        SwaggerBindMethod,
      ],
      exports: [
        ...(options.providers || []),
        typeOrmModule,
        optionProvider,
        currentDataSourceProvider,
        TransformInputService,
        EntityPropsMapService,
        SwaggerBindMethod,
        ...(options.imports || []),
      ],
    };
  }
}
