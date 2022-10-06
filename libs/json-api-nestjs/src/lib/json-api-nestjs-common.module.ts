import {DynamicModule, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {ModuleOptions} from '../lib/types';
import {GLOBAL_MODULE_OPTIONS_TOKEN} from './constants';
import {ajvFactory} from './factory'
import {ErrorInterceptors} from './mixin/interceptors'


@Module({})
export class JsonApiNestJsCommonModule {

  static forRoot(options: ModuleOptions): DynamicModule {
    const optionProvider = {
      provide: GLOBAL_MODULE_OPTIONS_TOKEN,
      useValue: options
    }

    const typeOrmModule = TypeOrmModule.forFeature(
      options.entities,
      options.connectionName
    );
    return {
      module: JsonApiNestJsCommonModule,
      imports: [
        typeOrmModule
      ],
      providers: [
        ...(options.providers || []),
        ajvFactory,
        optionProvider,
        ErrorInterceptors
      ],
      exports: [
        ...(options.providers || []),
        typeOrmModule,
        ajvFactory,
        optionProvider,
        ErrorInterceptors
      ]
    }
  }
}
