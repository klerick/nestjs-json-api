import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { OperationController } from './controllers';
import { ExplorerService, ExecuteService, SwaggerService } from './service';

import {
  MapControllerEntity,
  MapEntityNameToEntity,
  ZodInputOperation,
  AsyncIterate,
} from './factory';
import { ModuleOptions } from '../../types';

@Module({})
export class AtomicOperationModule {
  static forRoot(
    options: ModuleOptions,
    entityModules: DynamicModule[],
    commonModule: DynamicModule
  ): DynamicModule {
    return {
      module: AtomicOperationModule,
      controllers: [OperationController],
      providers: [
        ExplorerService,
        ExecuteService,
        SwaggerService,
        AsyncIterate,
        MapControllerEntity(options.entities, entityModules),
        MapEntityNameToEntity(options.entities),
        ZodInputOperation(options.connectionName),
      ],
      imports: [DiscoveryModule, commonModule],
    };
  }
}
