import { DynamicModule } from '@nestjs/common';

import { MixinOptions, DecoratorOptions } from './types';
import { createController } from './helper';
import {
  JSON_API_DECORATOR_OPTIONS,
  CONTROL_OPTIONS_TOKEN,
  JSON_API_MODULE_POSTFIX,
  CURRENT_ENTITY,
  FIND_ONE_ROW_ENTITY,
  CHECK_RELATION_NAME,
} from '../../constants';
import { ConfigParam, RequiredFromPartial } from '../../types';
import { MicroOrmParam } from '../micro-orm';
import { TypeOrmParam } from '../type-orm';
import { bindController, getProviderName, nameIt } from './helper';
import {
  ZodInputQuerySchema,
  ZodPostSchema,
  ZodQuerySchema,
  ZodPatchSchema,
  ZodInputPatchRelationshipSchema,
  ZodInputPostRelationshipSchema,
} from './factory';
import { SwaggerBindService } from './swagger';
import { JsonApiTransformerService } from './service/json-api-transformer.service';

export class MixinModule {
  static forRoot(options: MixinOptions): DynamicModule {
    const { entity, controller, imports, ormModule } = options;
    const controllerClass = createController(entity, controller);

    const decoratorOptions: DecoratorOptions =
      Reflect.getMetadata(JSON_API_DECORATOR_OPTIONS, controllerClass) || {};

    const moduleConfig: RequiredFromPartial<
      ConfigParam & (MicroOrmParam | TypeOrmParam)
    > = {
      ...options.config,
      ...decoratorOptions,
    };

    bindController(controllerClass, entity, moduleConfig);
    const optionProvider = {
      provide: CONTROL_OPTIONS_TOKEN,
      useValue: moduleConfig,
    };

    const currentEntityProvider = {
      provide: CURRENT_ENTITY,
      useValue: entity,
    };

    const findOneRowEntityProvider = {
      provide: FIND_ONE_ROW_ENTITY,
      useValue: undefined,
    };

    const checkRelationNameProvider = {
      provide: CHECK_RELATION_NAME,
      useValue: undefined,
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
        findOneRowEntityProvider,
        checkRelationNameProvider,
        JsonApiTransformerService,
        ...ormModule.getUtilProviders(entity),
        ZodInputQuerySchema(entity),
        ZodQuerySchema(entity),
        ZodPatchSchema(entity),
        ZodPostSchema(entity),
        SwaggerBindService,
        ZodInputPatchRelationshipSchema,
        ZodInputPostRelationshipSchema,
      ],
      imports: imports,
    };
  }
}
