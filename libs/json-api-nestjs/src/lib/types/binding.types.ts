import { RequestMethod } from '@nestjs/common';
import {ObjectLiteral} from 'typeorm/common/ObjectLiteral';

import { PipeFabric } from './module.types';
import { ControllerTypes } from './controller.types';


export type MethodName =
  | 'getAll'
  | 'getOne'
  | 'getRelationship'
  // | 'getDirectAll'
  // | 'getDirectOne'
  | 'deleteOne'
  | 'deleteRelationship'
  | 'postOne'
  | 'postRelationship'
  | 'patchOne'
  | 'patchRelationship';

type MapNameToTypeMethod = {
  getAll: RequestMethod.GET,
  // getDirectAll: RequestMethod.GET,
  // getDirectOne: RequestMethod.GET,
  getOne: RequestMethod.GET,
  patchOne: RequestMethod.PATCH,
  patchRelationship: RequestMethod.PATCH,
  postOne: RequestMethod.POST,
  postRelationship: RequestMethod.POST,
  deleteOne: RequestMethod.DELETE,
  deleteRelationship: RequestMethod.DELETE,
  getRelationship: RequestMethod.GET
};


export interface Binding<T extends MethodName> {
  path: string;
  method: MapNameToTypeMethod[T];
  name: T;
  implementation: ControllerTypes<any>[T];
  parameters: {
    decorator: ParameterDecorator;
    property?: string;
    mixins: PipeFabric[];
  }[]
}

export type BindingsConfig = {
  [Key in MethodName]: Binding<Key>;
};
