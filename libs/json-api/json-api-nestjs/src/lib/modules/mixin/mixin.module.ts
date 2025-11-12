import { DynamicModule } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ModuleMixinOptions } from '../../types';
import { createController, getProviderName, nameIt } from './helpers';
import {
  CONTROLLER_OPTIONS_TOKEN,
  CURRENT_ENTITY,
  JSON_API_DECORATOR_OPTIONS,
  JSON_API_MODULE_POSTFIX,
} from '../../constants';
import { DecoratorOptions, EntityControllerParam } from './types';
import { bindController } from './helpers/bind-controller';
import { EntityParamMapService, JsonApiTransformerService } from './service';
import { SwaggerBindService } from './swagger';
import {
  ZodInputQuerySchema,
  ZodPostSchema,
  ZodQuerySchema,
  ZodPatchSchema,
  ZodInputPatchRelationshipSchema,
  ZodInputPostRelationshipSchema,
} from './factory';

export class MixinModule {
  static forRoot(mixinOptions: ModuleMixinOptions): DynamicModule {
    const { entity, controller, imports, ormModule, config } = mixinOptions;
    const controllerClass = createController(entity, controller);

    const decoratorOptions: DecoratorOptions =
      Reflect.getMetadata(JSON_API_DECORATOR_OPTIONS, controllerClass) || {};

    const moduleConfig: EntityControllerParam = {
      ...config.options,
      ...decoratorOptions,
    };

    bindController(controllerClass, entity, moduleConfig);

    mixinOptions.config.hooks.afterCreateController(controllerClass)

    const optionProvider = {
      provide: CONTROLLER_OPTIONS_TOKEN,
      useValue: moduleConfig,
    };

    const currentEntityProvider = {
      provide: CURRENT_ENTITY,
      useValue: entity,
    };

    return {
      module: nameIt(
        getProviderName(entity, JSON_API_MODULE_POSTFIX),
        MixinModule
      ),
      controllers: [controllerClass],
      providers: [
        optionProvider,
        currentEntityProvider,
        EntityParamMapService,
        JsonApiTransformerService,
        SwaggerBindService,
        ZodInputQuerySchema(),
        ZodPostSchema(),
        ZodQuerySchema(),
        ZodPatchSchema(),
        ZodInputPatchRelationshipSchema,
        ZodInputPostRelationshipSchema,
        ...ormModule.getUtilProviders(entity),
      ],
      imports: [...imports, DiscoveryModule],
    };
  }
}
