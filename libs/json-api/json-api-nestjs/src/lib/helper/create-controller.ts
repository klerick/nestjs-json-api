import { Controller, Inject, Type, UseInterceptors } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

import { camelToKebab, getProviderName, nameIt } from './utils';
import {
  JSON_API_CONTROLLER_POSTFIX,
  JSON_API_DECORATOR_ENTITY,
  JSON_API_DECORATOR_OPTIONS,
  TYPEORM_SERVICE,
  TYPEORM_SERVICE_PROPS,
} from '../constants';
import { JsonBaseController } from '../mixin/controller/json-base.controller';
import { ErrorInterceptors, LogTimeInterceptors } from '../mixin/interceptors';

import { DecoratorOptions } from '../types';

export function createController(
  entity: EntityClassOrSchema,
  controller?: Type<any>
): Type<any> {
  const controllerClass =
    controller ||
    nameIt(
      getProviderName(entity, JSON_API_CONTROLLER_POSTFIX),
      JsonBaseController
    );

  if (!Reflect.hasMetadata(JSON_API_DECORATOR_ENTITY, controllerClass)) {
    Reflect.defineMetadata(JSON_API_DECORATOR_ENTITY, entity, controllerClass);
  }

  const entityName =
    entity instanceof Function ? entity.name : entity.options.name;

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

  Controller(
    decoratorOptions?.['overrideRoute'] || `${camelToKebab(entityName)}`
  )(controllerClass);

  Inject(TYPEORM_SERVICE)(controllerClass.prototype, TYPEORM_SERVICE_PROPS);
  UseInterceptors(LogTimeInterceptors)(controllerClass);
  UseInterceptors(ErrorInterceptors)(controllerClass);
  return controllerClass;
}
