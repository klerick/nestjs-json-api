import { NestInterceptor, Type } from '@nestjs/common';
import { Module } from '@nestjs/core/injector/module';
import { Controller } from '@nestjs/common/interfaces';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { Entity, MethodName } from '../../../types';
import { JsonBaseController } from '../../../mixin/controller/json-base.controller';

export type MapControllerInterceptor = Map<
  Controller,
  Map<(...arg: any) => any, NestInterceptor[]>
>;
export type MapController = Map<EntityClassOrSchema, Type<any>>;
export type MapEntity = Map<string, EntityClassOrSchema>;

export type OperationMethode = keyof Omit<
  { [k in MethodName]: string },
  'getAll' | 'getOne' | 'getRelationship'
>;

export type ParamsForExecute<
  E extends Entity = Entity,
  O extends OperationMethode = OperationMethode
> = {
  methodName: O;
  controller: Type<JsonBaseController<E>>;
  params: Parameters<JsonBaseController<E>[O]>;
  module: Module;
};
