import { Controller, UseInterceptors, Inject } from '@nestjs/common';
import { PROPERTY_DEPS_METADATA } from '@nestjs/common/constants';
import { paramCase } from 'param-case';

import { getServiceToken, mixin, props } from '../../helpers';
import { Bindings } from '../../config/bindings';
import {
  interceptorMixin,
  transformMixin,
  serviceMixin,
} from '..';
import {
  NestController,
  ModuleOptions,
  Entity,
} from '../../types';


export function moduleMixin(
  globalPrefix: ModuleOptions['globalPrefix'],
  controller: NestController,
  entity: Entity,
  connectionName: string,
) {
  const entityName = entity instanceof Function ? entity.name : entity.options.name;
  const builtController = controller || class ControllerMixin {};
  const builtTransform = transformMixin(entity, connectionName);
  const builtService = serviceMixin(entity, builtTransform, connectionName);

  Controller(`${globalPrefix}/${paramCase(entityName)}`)(builtController);
  Inject(builtService)(builtController.prototype, 'serviceMixin');
  UseInterceptors(interceptorMixin())(builtController);

  const properties = Reflect.getMetadata(PROPERTY_DEPS_METADATA, builtController);
  const serviceToken = getServiceToken(builtController);
  if (properties.find(item => item.type === serviceToken)) {
    const serviceProp = properties.find(item => item.type === serviceToken);
    const restProps = properties.filter(item => item.type !== serviceToken);
    serviceProp.type = builtService;
    Reflect.defineMetadata(PROPERTY_DEPS_METADATA, [serviceProp, ...restProps], builtController);
  }

  Object.values(Bindings).forEach(config => {
    props(builtController, entity, config, connectionName);
  });

  return {
    controller: mixin(builtController),
    providers: [
      builtTransform,
      builtService
    ]
  };
}
