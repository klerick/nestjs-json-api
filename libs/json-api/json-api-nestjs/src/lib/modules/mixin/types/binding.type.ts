import { Type } from '@nestjs/common/interfaces';
import { PipeTransform, RequestMethod } from '@nestjs/common';
import { AnyEntity, EntityClass } from '@klerick/json-api-nestjs-shared';
import { JsonBaseController } from '../controllers';
import { PipeMixin } from '../../../types';
import { EntityControllerParam } from './decorator-options.type';

export type MethodName =
  | 'getAll'
  | 'getOne'
  | 'postOne'
  | 'patchOne'
  | 'getRelationship'
  | 'deleteOne'
  | 'deleteRelationship'
  | 'postRelationship'
  | 'patchRelationship';

type MapNameToTypeMethod = {
  getAll: RequestMethod.GET;
  getOne: RequestMethod.GET;
  patchOne: RequestMethod.PATCH;
  patchRelationship: RequestMethod.PATCH;
  postOne: RequestMethod.POST;
  postRelationship: RequestMethod.POST;
  deleteOne: RequestMethod.DELETE;
  deleteRelationship: RequestMethod.DELETE;
  getRelationship: RequestMethod.GET;
};

export type PipeFabric = <Entity extends EntityClass<AnyEntity>>(
  entity: Entity,
  config?: EntityControllerParam
) => PipeMixin;

export interface Binding<T extends MethodName> {
  path: string;
  method: MapNameToTypeMethod[T];
  name: T;
  implementation: JsonBaseController<object>[T];
  parameters: {
    decorator: (
      property?: string,
      ...pipes: (Type<PipeTransform> | PipeTransform)[]
    ) => ParameterDecorator;
    property?: string;
    mixins: PipeFabric[];
  }[];
}

export type BindingsConfig = {
  [Key in MethodName]: Binding<Key>;
};
