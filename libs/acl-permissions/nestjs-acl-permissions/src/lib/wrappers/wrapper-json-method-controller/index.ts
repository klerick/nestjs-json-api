import { Inject, Type } from '@nestjs/common';
import {
  JsonBaseController,
} from '@klerick/json-api-nestjs';
import { ModuleRef } from '@nestjs/core';
import { MODULE_REF_PROPS } from '../../constants';
import { onModuleInit } from './on-module-init';

export function wrapperJsonMethodController<E extends object>(
  controllerClass: Type<JsonBaseController<E, 'id'>>
) {

  if (!controllerClass.prototype['onModuleInit']) {
    controllerClass.prototype['onModuleInit'] = onModuleInit;
  } else {
    const saveInit = controllerClass.prototype['onModuleInit'];
    controllerClass.prototype['onModuleInit'] = function (this: any) {
      saveInit.call(this);
      onModuleInit.call(this);
    }
  }

  Inject(ModuleRef)(controllerClass.prototype, MODULE_REF_PROPS);
}
