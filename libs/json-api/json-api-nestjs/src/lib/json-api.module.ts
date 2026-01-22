import { DynamicModule, Module } from '@nestjs/common';
import { OrmModule, ParamsModule } from './types';
import { prepareConfig, getController } from './utils';
import { ENTITY_PARAM_MAP } from './constants';
import { AtomicOperationModule, MixinModule } from './modules';
import {
  ErrorInterceptors,
  LogTimeInterceptors,
} from './modules/mixin/interceptors';
import { ErrorFormatService } from './modules/mixin/service';

@Module({})
export class JsonApiModule {
  public static forRoot<M extends OrmModule>(
    module: M,
    options: ParamsModule<M>
  ): DynamicModule {
    const prepareOptions = prepareConfig(options);
    prepareOptions.providers.push(
      ErrorInterceptors,
      ErrorFormatService,
      LogTimeInterceptors
    );
    const commonOrmModule = module.forRoot(prepareOptions);

    if (
      !commonOrmModule.providers ||
      !commonOrmModule.providers.find(
        (i) => 'provide' in i && i.provide === ENTITY_PARAM_MAP
      )
    )
      throw new Error(
        `The module ${module.name} should be provide ${ENTITY_PARAM_MAP.description}`
      );

    const entitiesForControllers = prepareOptions.entities.filter(
      (entity) => !prepareOptions.excludeControllers.includes(entity)
    );

    const entitiesModules = entitiesForControllers.map((entityItem) =>
      MixinModule.forRoot({
        entity: entityItem,
        imports: [commonOrmModule, ...prepareOptions.imports],
        ormModule: module,
        controller: getController(entityItem, prepareOptions.controllers),
        config: prepareOptions,
      })
    );

    const atomicOperation = prepareOptions.options.operationUrl
      ? AtomicOperationModule.forRoot(
          prepareOptions.options.operationUrl,
          entitiesModules,
          commonOrmModule
        )
      : [];

    return {
      module: JsonApiModule,
      imports: [...entitiesModules, ...atomicOperation],
    };
  }
}
