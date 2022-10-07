import {
  Controller,
  DynamicModule,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import { PROPERTY_DEPS_METADATA } from '@nestjs/common/constants';

import {
  BaseModuleStaticClass,
  ConfigParam,
  DecoratorOptions,
} from '../../types';
import {
  nameIt,
  bindController,
  setSwaggerDecorator,
  getProviderName,
  camelToKebab,
} from '../../helper';
import { JsonBaseController } from '../controller';
import { typeormMixin, transformMixin } from '../';
import {
  JSON_API_DECORATOR_OPTIONS,
  ConfigParamDefault,
  JSON_API_SERVICE_POSTFIX,
  JSON_API_CONTROLLER_POSTFIX,
  JSON_API_MODULE_POSTFIX,
  CONFIG_PARAM_POSTFIX,
} from '../../constants';
import { ErrorInterceptors } from '../interceptors';

export const BaseModuleClass: BaseModuleStaticClass = class {
  public static forRoot(): DynamicModule {
    return {
      module: class {},
    };
  }
};

BaseModuleClass.forRoot = function (options): DynamicModule {
  const { entity, connectionName, controller } = options;
  const entityName =
    entity instanceof Function ? entity.name : entity.options.name;

  const controllerClass =
    controller ||
    nameIt(getProviderName(entity, JSON_API_CONTROLLER_POSTFIX), class {});
  const transformService = transformMixin(entity, connectionName);
  const serviceClass = typeormMixin(entity, connectionName, transformService);
  Controller(`${camelToKebab(entityName)}`)(controllerClass);
  UseInterceptors(ErrorInterceptors)(controllerClass);
  Inject(serviceClass)(controllerClass.prototype, 'serviceMixin');
  const properties = Reflect.getMetadata(
    PROPERTY_DEPS_METADATA,
    controllerClass
  );

  const serviceToken = getProviderName(
    controllerClass,
    JSON_API_SERVICE_POSTFIX
  );
  if (
    Array.isArray(properties) &&
    properties.find((item) => item.type === serviceToken)
  ) {
    const serviceProp = properties.find((item) => item.type === serviceToken);
    const restProps = properties.filter((item) => item.type !== serviceToken);
    serviceProp.type = serviceClass;
    Reflect.defineMetadata(
      PROPERTY_DEPS_METADATA,
      [serviceProp, ...restProps],
      controllerClass
    );
  }
  const decoratorOptions: DecoratorOptions = Reflect.getMetadata(
    JSON_API_DECORATOR_OPTIONS,
    controllerClass
  );
  const moduleConfig: ConfigParam = {
    ...ConfigParamDefault,
    ...options.config,
    ...decoratorOptions,
  };

  bindController(controllerClass, entity, connectionName);
  setSwaggerDecorator(controllerClass, entity, moduleConfig);

  const optionProvider = {
    provide: getProviderName(entity, CONFIG_PARAM_POSTFIX),
    useValue: moduleConfig,
  };

  return {
    module: nameIt(
      getProviderName(entity, JSON_API_MODULE_POSTFIX),
      BaseModuleClass
    ),
    controllers: [controllerClass],
    providers: [serviceClass, optionProvider, transformService],
    imports: [],
  };
};
