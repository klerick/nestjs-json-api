import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

import { NestProvider, ObjectLiteral, ResultModuleOptions } from '../../types';
import {
  CurrentEntityManager,
  CurrentDataSourceProvider,
  CurrentEntityRepository,
  FindOneRowEntityFactory,
  CheckRelationNameFactory,
  OrmServiceFactory,
  RunInTransactionFactory,
  EntityPropsMap,
} from './factory';
import { TypeormUtilsService } from './service';
import { GLOBAL_MODULE_OPTIONS_TOKEN } from '../../constants';

export class TypeOrmJsonApiModule {
  static module = 'typeOrm' as const;
  static forRoot(options: ResultModuleOptions): DynamicModule {
    const optionProvider = {
      provide: GLOBAL_MODULE_OPTIONS_TOKEN,
      useValue: options,
    };

    const typeOrmModule = TypeOrmModule.forFeature(
      options.entities as EntityClassOrSchema[],
      options.connectionName
    );

    const currentProvider = [
      ...(options.providers || []),
      optionProvider,
      CurrentDataSourceProvider(options.connectionName),
      CurrentEntityManager(),
      EntityPropsMap(options.entities),
      RunInTransactionFactory(),
    ];

    const currentImport = [typeOrmModule, ...(options.imports || [])];

    return {
      module: TypeOrmJsonApiModule,
      imports: currentImport,
      providers: currentProvider,
      exports: [...currentProvider, ...currentImport],
    };
  }

  static getUtilProviders(entity: ObjectLiteral): NestProvider {
    return [
      CurrentEntityRepository(entity),
      TypeormUtilsService,
      OrmServiceFactory(),
      FindOneRowEntityFactory(),
      CheckRelationNameFactory(),
    ];
  }
}
