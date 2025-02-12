import { NestInterceptor, Type } from '@nestjs/common';
import { Module } from '@nestjs/core/injector/module';
import { Controller } from '@nestjs/common/interfaces';
import { EntityTarget, ObjectLiteral } from '../../../types';
import { JsonBaseController } from '../../mixin/controller/json-base.controller';

export type MapControllerInterceptor = Map<
  Controller,
  Map<(...arg: any) => any, NestInterceptor[]>
>;
export type MapController<E extends ObjectLiteral = ObjectLiteral> = Map<
  EntityTarget<E>,
  Type<any>
>;
export type MapEntity<E extends ObjectLiteral = ObjectLiteral> = Map<
  string,
  EntityTarget<E>
>;

export type OperationMethode<E extends ObjectLiteral> = keyof Omit<
  { [k in keyof JsonBaseController<E>]: string },
  'getAll' | 'getOne' | 'getRelationship'
>;

export type ParamsForExecute<
  E extends ObjectLiteral = ObjectLiteral,
  O extends OperationMethode<E> = OperationMethode<E>
> = {
  methodName: O;
  controller: Type<JsonBaseController<E>>;
  params: Parameters<JsonBaseController<E>[O]>;
  module: Module;
};
