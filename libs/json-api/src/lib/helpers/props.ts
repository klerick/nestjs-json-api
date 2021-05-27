import { Delete, Patch, Get, Post, RequestMethod } from '@nestjs/common';
import { paramCase } from 'param-case';

import { SwaggerService } from '../services/swagger/swagger.service';
import {
  ControllerMixin,
  Binding,
  Entity,
} from '../types';


export function props(controller: ControllerMixin, entity: Entity, config: Binding, connectionName: string): void {
  const entityName = entity instanceof Function ? entity.name : entity.options.name;
  const urlName = paramCase(entityName);
  const { name, path, parameters, method, implementation } = config;

  if (!controller.prototype[name]) {
    controller.prototype[name] = function (...args) {
      return implementation.call(this, ...args);
    };
  }

  const descriptor = Object.getOwnPropertyDescriptor(controller.prototype, name);
  switch (method) {
    case RequestMethod.GET: {
      Get(path)(controller.prototype, name, descriptor);
      break;
    }
    case RequestMethod.POST: {
      Post(path)(controller.prototype, name, descriptor);
      break;
    }
    case RequestMethod.PATCH: {
      Patch(path)(controller.prototype, name, descriptor);
      break;
    }
    case RequestMethod.DELETE: {
      Delete(path)(controller.prototype, name, descriptor);
      break;
    }
    default: {
      throw new Error(`Method '${method}' unsupported`);
    }
  }

  parameters.forEach((parameter, key) => {
    const { property, decorator, mixins } = parameter;
    decorator(property, ...(mixins.map(mixin => mixin(entity, connectionName))))(
      controller.prototype,
      name,
      key,
    );
  });

  const swaggerPath = `/${urlName}` + (path ? `/${path}` : '');
  SwaggerService.addRouteConfig(entity, swaggerPath, name);
}
