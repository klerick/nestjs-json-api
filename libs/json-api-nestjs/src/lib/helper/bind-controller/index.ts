import {Delete, Get, Post, Patch, RequestMethod, HttpCode} from '@nestjs/common';

import { Bindings } from '../../config/bindings';
import { NestController, Entity, DecoratorOptions } from '../../types';
import { JSON_API_DECORATOR_OPTIONS } from '../../constants';


export function bindController(controller: NestController, entity: Entity, connectionName: string): void {
  for (const methodName in Bindings) {

    const { name, path, parameters, method, implementation } = Bindings[methodName];

    const decoratorOptions: DecoratorOptions = Reflect.getMetadata(JSON_API_DECORATOR_OPTIONS, controller);
    if (decoratorOptions) {
      const { allowMethod = [] } = decoratorOptions;
      if (!allowMethod.includes(name)) continue;
    }

    let implementationResultFunction = implementation;
    // Dirty hack, @nestjs/swagger will crash, because descriptor is empty for inherite class
    if (controller.prototype[name]) {
      implementationResultFunction = controller.prototype[name];
    }
    controller.prototype[name] = function(...args) {
      return implementationResultFunction.call(this, ...args);
    };

    const descriptor = Object.getOwnPropertyDescriptor(controller.prototype, name);

    switch (method) {
      case RequestMethod.GET: {
        Get(path)(controller.prototype, name, descriptor);
        break;
      }
      case RequestMethod.DELETE: {
        HttpCode(204)(controller.prototype, name, descriptor);
        Delete(path)(controller.prototype, name, descriptor);
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
      default: {
        throw new Error(`Method '${method}' unsupported`);
      }
    }

    for (const key in parameters) {
      const parameter = parameters[key];
      const { property, decorator, mixins } = parameter;
      const resultMixin = mixins.map(mixin => mixin(entity, connectionName));
      decorator(property, ...resultMixin)(controller.prototype, name, key);
    }
  }
}

