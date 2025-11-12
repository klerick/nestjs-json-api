import {
  type DynamicModule,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import {
  getMikroORMToken,
  MikroOrmModule,
  MikroOrmModuleFeatureOptions,
} from '@mikro-orm/nestjs';

import { config, CONTEXT_STORE_NAME } from './config';
import { ModuleRef } from '@nestjs/core';
import type { IncomingMessage, ServerResponse } from 'http';
import { AnyEntity, EntityName, MikroORM } from '@mikro-orm/core';
import { ClsService } from 'nestjs-cls';

@Module({})
export class MicroOrmDatabaseModule implements NestModule {
  static async forRoot(): Promise<DynamicModule> {
    const MikroOrmDynamicModule = await MikroOrmModule.forRoot(config);

    return {
      module: MicroOrmDatabaseModule,
      imports: [MikroOrmDynamicModule],
      exports: [MikroOrmDynamicModule],
    };
  }

  static forFeature(
    options: EntityName<AnyEntity>[] | MikroOrmModuleFeatureOptions,
    contextName?: string
  ): DynamicModule {
    const { providers, exports } = MikroOrmModule.forFeature(
      options,
      contextName
    );

    return {
      module: MicroOrmDatabaseModule,
      providers,
      exports,
    };
  }

  @Inject(ModuleRef) private readonly moduleRef!: ModuleRef;
  configure(consumer: MiddlewareConsumer) {
    const { contextName } = config;

    const orm = this.moduleRef.get<MikroORM>(getMikroORMToken(contextName), {
      strict: false,
    });

    const clsService = this.moduleRef.get<ClsService>(ClsService, {
      strict: false,
    });

    consumer
      .apply(
        (
          req: IncomingMessage,
          res: ServerResponse,
          next: (error?: any) => void
        ) => {
          const forkEm = orm.em.fork({
            useContext: true,
            loggerContext: { contextName },
          });
          clsService.set(CONTEXT_STORE_NAME, forkEm);
          clsService.run({ ifNested: 'inherit' }, next);
        }
      )
      .forRoutes({ path: '/{*splat}', method: RequestMethod.ALL });
  }
}
