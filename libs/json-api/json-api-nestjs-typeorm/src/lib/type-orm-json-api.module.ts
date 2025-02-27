import { DynamicModule, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import {
  PrepareParams,
  NestProvider,
  MODULE_OPTIONS_TOKEN,
  ErrorFormatService,
} from '@klerick/json-api-nestjs';

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
import { TypeOrmFormatErrorService, TypeormUtilsService } from './service';

import { TypeOrmParam } from './type';

export class TypeOrmJsonApiModule {
  static forRoot(options: PrepareParams<TypeOrmParam>): DynamicModule {
    const optionProvider = {
      provide: MODULE_OPTIONS_TOKEN,
      useValue: options,
    };

    const typeOrmModule = TypeOrmModule.forFeature(
      options.entities as EntityClassOrSchema[],
      options.connectionName
    );

    const currentProvider: Provider[] = [
      ...(options.providers || []),
      optionProvider,
      CurrentDataSourceProvider(options.connectionName),
      CurrentEntityManager(),
      EntityPropsMap(options.entities),
      RunInTransactionFactory(),
      {
        provide: ErrorFormatService,
        useClass: TypeOrmFormatErrorService,
      },
    ];
    const currentImport: DynamicModule[] = [
      typeOrmModule,
      ...((options.imports || []) as DynamicModule[]),
    ];

    return {
      module: TypeOrmJsonApiModule,
      imports: currentImport,
      providers: currentProvider,
      exports: [...currentProvider, ...currentImport],
    };
  }

  static getUtilProviders(entity: object): NestProvider {
    return [
      CurrentEntityRepository(entity),
      TypeormUtilsService,
      OrmServiceFactory(),
      FindOneRowEntityFactory(),
      CheckRelationNameFactory(),
    ];
  }
}
