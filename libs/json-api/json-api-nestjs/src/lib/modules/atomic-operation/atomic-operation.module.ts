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
import { MAP_CONTROLLER_INTERCEPTORS } from './constants';
import { ErrorFormatService } from '../../modules/mixin/service';

@Module({})
export class AtomicOperationModule implements NestModule {
  static forRoot(
    operationUrl: string,
    entityModules: DynamicModule[],
    commonModule: DynamicModule
  ): DynamicModule[] {
    return [
      AtomicOperationModule.factoryModule(
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
    entityModules: DynamicModule[],
    commonModule: DynamicModule
  ): DynamicModule {

    const errorFormat = (commonModule.providers || []).find(i => 'provide' in i && i.provide === ErrorFormatService )
    if (!errorFormat) {
      throw new Error('ErrorFormatService not found, should be provide in common orm module')
    }
    const mapControllerEntityProvider = MapControllerEntity(entityModules);
    return {
      module: AtomicOperationModule,
      controllers: [OperationController],
      providers: [
        errorFormat,
        ExplorerService,
        ExecuteService,
        SwaggerService,
        AsyncIterate,
        mapControllerEntityProvider,
        MapEntityNameToEntity([...mapControllerEntityProvider.useValue.keys()]),
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


