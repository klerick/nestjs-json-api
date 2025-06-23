import { DynamicModule } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  PrepareParams,
  MODULE_OPTIONS_TOKEN,
  NestProvider,
  ErrorFormatService,
} from '@klerick/json-api-nestjs';
import { MicroOrmParam } from './type';

import {
  CurrentEntityManager,
  CurrentEntityMetadata,
  CurrentEntityRepository,
  CurrentMicroOrmProvider,
  OrmServiceFactory,
  RunInTransactionFactory,
  EntityPropsMap,
  CheckRelationNameFactory,
  FindOneRowEntityFactory,
} from './factory';
import { MicroOrmUtilService, MikroOrmFormatErrorService } from './service';

export class MicroOrmJsonApiModule {
  static forRoot(options: PrepareParams<MicroOrmParam>): DynamicModule {
    const optionProvider = {
      provide: MODULE_OPTIONS_TOKEN,
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
      CurrentEntityMetadata(),
      RunInTransactionFactory(),
      EntityPropsMap(options.entities),
      {
        provide: ErrorFormatService,
        useClass: MikroOrmFormatErrorService,
      },
    ];

    const currentImport = [
      microOrmModule,
      ...((options.imports || []) as DynamicModule[]),
    ];

    return {
      module: MicroOrmJsonApiModule,
      imports: currentImport,
      providers: currentProvider,
      exports: [...currentProvider, ...currentImport],
    };
  }

  static getUtilProviders(entity: object): NestProvider {
    return [
      CurrentEntityRepository(entity),
      CheckRelationNameFactory(),
      OrmServiceFactory(),
      MicroOrmUtilService,
      FindOneRowEntityFactory(),
    ];
  }
}
