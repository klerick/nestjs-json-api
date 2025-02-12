import { Controller, Inject, Type, UseInterceptors } from '@nestjs/common';

import { camelToKebab } from '../../../utils/nestjs-shared';

import { getProviderName, nameIt } from './utils';
import {
  JSON_API_CONTROLLER_POSTFIX,
  JSON_API_DECORATOR_OPTIONS,
  ORM_SERVICE,
  ORM_SERVICE_PROPS,
} from '../../../constants';
import { JsonBaseController } from '../controller/json-base.controller';
import { ErrorInterceptors, LogTimeInterceptors } from '../interceptors';

import { DecoratorOptions, MixinOptions } from '../types';

export function createController(
  entity: MixinOptions['entity'],
  controller?: MixinOptions['controller']
): Type<any> {
  const controllerClass =
    controller ||
    nameIt(
      getProviderName(entity, JSON_API_CONTROLLER_POSTFIX),
      JsonBaseController
    );

  const entityName = entity.name;

  if (
    !Object.prototype.isPrototypeOf.call(JsonBaseController, controllerClass)
  ) {
    throw new Error(
      `Controller "${controller?.name}" should be inherited of "JsonBaseController"`
    );
  }

  const decoratorOptions: DecoratorOptions = Reflect.getMetadata(
    JSON_API_DECORATOR_OPTIONS,
    controllerClass
  );

  const controllerPath =
    decoratorOptions && decoratorOptions['overrideRoute']
      ? decoratorOptions['overrideRoute'].toString()
      : `${camelToKebab(entityName)}`;
  Controller(controllerPath)(controllerClass);

  Inject(ORM_SERVICE)(controllerClass.prototype, ORM_SERVICE_PROPS);
  UseInterceptors(LogTimeInterceptors)(controllerClass);
  UseInterceptors(ErrorInterceptors)(controllerClass);
  return controllerClass;
}
