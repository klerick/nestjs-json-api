import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule as MainTypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

import { NestProvider, ObjectLiteral, ResultModuleOptions } from '../../types';
import {
  CurrentEntityManager,
  CurrentDataSourceProvider,
  ZodParamsFactory,
  CurrentEntityRepository,
  FindOneRowEntityFactory,
  CheckRelationNameFactory,
  OrmServiceFactory,
  GetFieldForEntity,
  RunInTransactionFactory,
} from './factory';
import {
  EntityPropsMapService,
  TransformDataService,
  TypeormUtilsService,
} from './service';
import { GLOBAL_MODULE_OPTIONS_TOKEN } from '../../constants';

export class TypeOrmModule {
  static forRoot(options: ResultModuleOptions): DynamicModule {
    const optionProvider = {
      provide: GLOBAL_MODULE_OPTIONS_TOKEN,
      useValue: options,
    };

    const typeOrmModule = MainTypeOrmModule.forFeature(
      options.entities as EntityClassOrSchema[],
      options.connectionName
    );

    const currentProvider = [
      ...(options.providers || []),
      optionProvider,
      CurrentDataSourceProvider(options.connectionName),
      CurrentEntityManager(),
      GetFieldForEntity(),
      EntityPropsMapService,
      RunInTransactionFactory(),
    ];

    const currentImport = [typeOrmModule, ...(options.imports || [])];

    return {
      module: TypeOrmModule,
      imports: currentImport,
      providers: currentProvider,
      exports: [...currentProvider, ...currentImport],
    };
  }

  static getUtilProviders(entity: ObjectLiteral): NestProvider {
    return [
      CurrentEntityRepository(entity),
      TransformDataService,
      TypeormUtilsService,
      ZodParamsFactory(),
      OrmServiceFactory(),
      FindOneRowEntityFactory(),
      CheckRelationNameFactory(),
    ];
  }
}
