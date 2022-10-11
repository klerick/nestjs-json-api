import { DynamicModule, Module } from '@nestjs/common';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ModuleOptions } from '../lib/types';
import {
  CURRENT_DATA_SOURCE_TOKEN,
  GLOBAL_MODULE_OPTIONS_TOKEN,
} from './constants';
import { ajvFactory } from './factory';
import { ErrorInterceptors } from './mixin/interceptors';

@Module({})
export class JsonApiNestJsCommonModule {
  static forRoot(options: ModuleOptions): DynamicModule {
    const optionProvider = {
      provide: GLOBAL_MODULE_OPTIONS_TOKEN,
      useValue: options,
    };

    const currentDataSourceProvider = {
      provide: CURRENT_DATA_SOURCE_TOKEN,
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [getDataSourceToken(options.connectionName)],
    };

    const typeOrmModule = TypeOrmModule.forFeature(
      options.entities,
      options.connectionName
    );
    return {
      module: JsonApiNestJsCommonModule,
      imports: [typeOrmModule, ...(options.imports || [])],
      providers: [
        ...(options.providers || []),
        ajvFactory,
        optionProvider,
        currentDataSourceProvider,
        ErrorInterceptors,
      ],
      exports: [
        ...(options.providers || []),
        typeOrmModule,
        ajvFactory,
        optionProvider,
        ErrorInterceptors,
        ...(options.imports || []),
      ],
    };
  }
}
