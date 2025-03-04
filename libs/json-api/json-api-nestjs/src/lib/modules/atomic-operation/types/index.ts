import { NestInterceptor, Type } from '@nestjs/common';
import { Module } from '@nestjs/core/injector/module';
import { Controller } from '@nestjs/common/interfaces';
import { EntityClass } from '@klerick/json-api-nestjs-shared';
import { JsonBaseController } from '../../mixin/controllers';

export type MapControllerInterceptor = Map<
  Controller,
  Map<(...arg: any) => any, NestInterceptor[]>
>;
export type MapController<E extends object = object> = Map<
  EntityClass<E>,
  Type<any>
>;
export type MapEntity<E extends object = object> = Map<string, EntityClass<E>>;

export type OperationMethode<E extends object> = keyof Omit<
  { [k in keyof JsonBaseController<E>]: string },
  'getAll' | 'getOne' | 'getRelationship'
>;

export type ParamsForExecute<
  E extends object = object,
  O extends OperationMethode<E> = OperationMethode<E>
> = {
  methodName: O;
  controller: Type<JsonBaseController<E>>;
  params: Parameters<JsonBaseController<E>[O]>;
  module: Module;
};
