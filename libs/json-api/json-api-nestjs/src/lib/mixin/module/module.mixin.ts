import { DynamicModule } from '@nestjs/common';

import { BaseModuleOptions, ConfigParam, DecoratorOptions } from '../../types';
import {
  createController,
  getProviderName,
  nameIt,
  bindController,
} from '../../helper';
import {
  JSON_API_DECORATOR_OPTIONS,
  ConfigParamDefault,
  JSON_API_MODULE_POSTFIX,
  CONTROL_OPTIONS_TOKEN,
} from '../../constants';
import {
  ZodInputQuerySchema,
  ZodQuerySchema,
  TypeormServiceFactory,
  EntityRepositoryFactory,
  ZodInputPostSchema,
  ZodInputPatchSchema,
  ZodInputPostRelationshipSchema,
  ZodInputPatchRelationshipSchema,
} from '../../factory';
import { TypeormUtilsService } from '../service';
import { TransformDataService } from '../service';
import { SwaggerBindService } from '../service/swagger-bind.service';

export class BaseModuleClass {
  static forRoot(options: BaseModuleOptions): DynamicModule {
    const { entity, connectionName, controller } = options;
    const controllerClass = createController(entity, controller);

    const decoratorOptions: DecoratorOptions =
      Reflect.getMetadata(JSON_API_DECORATOR_OPTIONS, controllerClass) || {};

    const moduleConfig: ConfigParam = {
      ...ConfigParamDefault,
      ...options.config,
      ...decoratorOptions,
    };

    bindController(controllerClass, entity, connectionName, moduleConfig);

    const optionProvider = {
      provide: CONTROL_OPTIONS_TOKEN,
      useValue: moduleConfig,
    };

    return {
      module: nameIt(
        getProviderName(entity, JSON_API_MODULE_POSTFIX),
        BaseModuleClass
      ),
      controllers: [controllerClass],
      providers: [
        ZodInputQuerySchema(entity),
        ZodQuerySchema(entity),
        ZodInputPostSchema(entity),
        ZodInputPatchSchema(entity),
        ZodInputPostRelationshipSchema,
        ZodInputPatchRelationshipSchema,
        TypeormServiceFactory(entity),
        EntityRepositoryFactory(entity),
        optionProvider,
        TypeormUtilsService,
        TransformDataService,
        SwaggerBindService,
      ],
      imports: [],
    };
  }
}
