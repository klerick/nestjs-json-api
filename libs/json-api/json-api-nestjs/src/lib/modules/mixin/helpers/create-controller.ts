import { Controller, Inject, UseInterceptors } from '@nestjs/common';
import { kebabCase } from 'change-case-commonjs';
import { ModuleMixinOptions, NestController } from '../../../types';
import { DecoratorOptions } from '../types';
import { getProviderName, nameIt } from './utils';
import { JsonBaseController } from '../controllers';
import {
  JSON_API_DECORATOR_OPTIONS,
  ORM_SERVICE_PROPS,
  ORM_SERVICE,
  JSON_API_CONTROLLER_POSTFIX,
} from '../../../constants';
import { ErrorInterceptors, LogTimeInterceptors } from '../interceptors';
import { getEntityName } from '@klerick/json-api-nestjs-shared';

export function createController(
  entity: ModuleMixinOptions['entity'],
  controller?: ModuleMixinOptions['controller']
): NestController[number] {
  const controllerClass =
    controller ||
    nameIt(
      getProviderName(entity, JSON_API_CONTROLLER_POSTFIX),
      JsonBaseController
    );

  const entityName = getEntityName(entity);

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
      : `${kebabCase(entityName)}`;

  Controller(controllerPath)(controllerClass);

  Inject(ORM_SERVICE)(controllerClass.prototype, ORM_SERVICE_PROPS);
  UseInterceptors(LogTimeInterceptors)(controllerClass);
  UseInterceptors(ErrorInterceptors)(controllerClass);
  return controllerClass;
}
