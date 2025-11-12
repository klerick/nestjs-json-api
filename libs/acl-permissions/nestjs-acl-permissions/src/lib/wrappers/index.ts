import { Type, UseGuards } from '@nestjs/common';
import { entityForClass, JsonBaseController, OrmService } from '@klerick/json-api-nestjs';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ModuleRef } from '@nestjs/core';
import {
  ACL_CONTROLLER_METADATA,
  MODULE_REF_PROPS,
  ORIGINAL_ORM_SERVICE,
} from '../constants';
import { AclControllerMetadata } from '../types';
import { AclGuard } from '../guards';
import { loggerWrapper } from './logger-init';
import { wrapperJsonMethodController } from './wrapper-json-method-controller';


export type WrapperJsonApiController<E extends object> = JsonBaseController<E, 'id'> & {
  [MODULE_REF_PROPS]: ModuleRef;
  [ORIGINAL_ORM_SERVICE]: OrmService<E, 'id'>;
};

export function wrapperJsonApiController(controllerClass: Type<any>) {

  const entity = entityForClass(controllerClass);
  if (!entity) return;

  const existingMetadata = Reflect.getMetadata(
    ACL_CONTROLLER_METADATA,
    controllerClass
  ) as AclControllerMetadata | undefined;
  if (!existingMetadata) {
    const metadata: AclControllerMetadata = {
      subject: entity,
      methods: {},
      enabled: true,
    };
    Reflect.defineMetadata(ACL_CONTROLLER_METADATA, metadata, controllerClass);
  }

  const existingGuard =
    Reflect.getMetadata(GUARDS_METADATA, controllerClass) || [];

  const hasPermissionInterceptor = existingGuard.some(
    (guard: any) => guard === AclGuard || guard?.metatype === AclGuard
  );

  if (!hasPermissionInterceptor) {
    UseGuards(AclGuard)(controllerClass);
  }

  wrapperJsonMethodController(controllerClass)

  loggerWrapper.debug(
    `Add ACL to "${controllerClass.name}" has been added`
  );
}
