import {
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  RequestMethod,
} from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';

import { Bindings } from '../config/bindings';
import {
  ConfigParam,
  DecoratorOptions,
  Entity,
  ExtractNestType,
  MethodName,
  NestController,
} from '../types';
import { JSON_API_DECORATOR_OPTIONS } from '../constants';

export function bindController(
  controller: ExtractNestType<NestController>,
  entity: Entity,
  connectionName: string,
  config: ConfigParam
): void {
  for (const methodName in Bindings) {
    const { name, path, parameters, method, implementation } =
      Bindings[methodName as MethodName];

    const decoratorOptions: DecoratorOptions = Reflect.getMetadata(
      JSON_API_DECORATOR_OPTIONS,
      controller
    );
    if (decoratorOptions) {
      const { allowMethod = Object.keys(Bindings) } = decoratorOptions;
      if (!allowMethod.includes(name)) continue;
    }

    if (!controller.prototype.hasOwnProperty(name)) {
      // need uniq descriptor for correct work swagger
      Reflect.defineProperty(controller.prototype, name, {
        value: function (
          ...arg: Parameters<typeof implementation>
        ): ReturnType<typeof implementation> {
          return this.constructor.__proto__.prototype[name].call(this, ...arg);
        },
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }

    const descriptor = Reflect.getOwnPropertyDescriptor(
      controller.prototype,
      name
    );

    if (!descriptor) {
      throw new Error(
        `Descriptor for "${controller.name}[${name}]" is undefined`
      );
    }

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
    const paramsMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      controller.prototype.constructor,
      name
    );
    for (const key in parameters) {
      const parameter = parameters[key];
      const { property, decorator, mixins } = parameter;
      const resultMixin = mixins.map((mixin) =>
        mixin(entity, connectionName, config)
      );

      if (paramsMetadata) {
        let typeDecorator: RouteParamtypes;
        switch (decorator) {
          case Query:
            typeDecorator = RouteParamtypes.QUERY;
            break;
          case Param:
            typeDecorator = RouteParamtypes.PARAM;
            break;
          case Body:
            typeDecorator = RouteParamtypes.BODY;
        }
        const tmp = Object.entries(paramsMetadata)
          .filter(([k, v]) => k.split(':').at(0) === typeDecorator.toString())
          .reduce(
            (acum, [k, v]) => (acum.push(...(v as any).pipes), acum),
            [] as any
          );
        resultMixin.push(...tmp);
      }
      decorator(property, ...resultMixin)(
        controller.prototype,
        name,
        parseInt(key, 10)
      );
    }
  }
}
