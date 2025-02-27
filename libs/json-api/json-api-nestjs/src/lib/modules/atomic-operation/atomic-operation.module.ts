import { AsyncLocalStorage } from 'async_hooks';
import {
  DynamicModule,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { DiscoveryModule, RouterModule } from '@nestjs/core';

import { OperationController } from './controllers';
import { ExplorerService, ExecuteService, SwaggerService } from './service';

import {
  MapControllerEntity,
  MapEntityNameToEntity,
  ZodInputOperation,
  AsyncIterate,
} from './factory';
import { AnyEntity, EntityClass } from '../../types';
import { MAP_CONTROLLER_INTERCEPTORS } from './constants';

@Module({})
export class AtomicOperationModule implements NestModule {
  static forRoot(
    operationUrl: string,
    entities: EntityClass<AnyEntity>[],
    entityModules: DynamicModule[],
    commonModule: DynamicModule
  ): DynamicModule[] {
    return [
      AtomicOperationModule.factoryModule(
        entities,
        entityModules,
        commonModule
      ),
      RouterModule.register([
        {
          module: AtomicOperationModule,
          path: operationUrl,
        },
      ]),
    ];
  }

  private static factoryModule(
    entities: EntityClass<AnyEntity>[],
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
        MapControllerEntity(entities, entityModules),
        MapEntityNameToEntity(entities),
        ZodInputOperation(),
        {
          provide: MAP_CONTROLLER_INTERCEPTORS,
          useValue: new Map(),
        },
        {
          provide: AsyncLocalStorage,
          useValue: new AsyncLocalStorage(),
        },
      ],
      imports: [DiscoveryModule, commonModule],
    };
  }

  @Inject(AsyncLocalStorage) private readonly als!: AsyncLocalStorage<any>;

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: any) => {
        const store = {
          req: req,
          res: res,
          next: next,
        };
        this.als.run(store, () => next());
      })
      .forRoutes('{*splat}');
  }
}
