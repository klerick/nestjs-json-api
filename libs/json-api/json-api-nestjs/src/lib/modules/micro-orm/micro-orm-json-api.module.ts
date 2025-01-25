import { DynamicModule } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { NestProvider, ResultModuleOptions, ObjectLiteral } from '../../types';
import { GLOBAL_MODULE_OPTIONS_TOKEN } from '../../constants';
import {
  CurrentEntityManager,
  CurrentEntityMetadata,
  CurrentEntityRepository,
  CurrentMicroOrmProvider,
  GetFieldForEntity,
  OrmServiceFactory,
  RunInTransactionFactory,
  ZodParamsFactory,
} from './factory';

export class MicroOrmJsonApiModule {
  static module = 'microOrm' as const;
  static forRoot(options: ResultModuleOptions): DynamicModule {
    const optionProvider = {
      provide: GLOBAL_MODULE_OPTIONS_TOKEN,
      useValue: options,
    };

    const microOrmModule = MikroOrmModule.forFeature(
      options.entities,
      options.connectionName
    );

    const currentProvider = [
      ...(options.providers || []),
      optionProvider,
      CurrentMicroOrmProvider(options.connectionName),
      CurrentEntityManager(),
      GetFieldForEntity(),
      RunInTransactionFactory(),
    ];

    const currentImport = [microOrmModule, ...(options.imports || [])];

    return {
      module: MicroOrmJsonApiModule,
      imports: currentImport,
      providers: currentProvider,
      exports: [...currentProvider, ...currentImport],
    };
  }

  static getUtilProviders(entity: ObjectLiteral): NestProvider {
    return [
      CurrentEntityRepository(entity),
      CurrentEntityMetadata(),
      ZodParamsFactory(entity as any),
      OrmServiceFactory(),
    ];
  }
}
