import { RequestMethod } from '@nestjs/common';

import { controllerMethod, PipeFabric } from '.';

export type BindingsConfig = {
  [key in MethodName]: Binding;
};

export interface Binding {
  path: string;
  method: RequestMethod;
  name: MethodName;
  implementation: controllerMethod;
  parameters: {
    decorator: Function;
    property?: string;
    mixins: PipeFabric[];
  }[]
}

export type MethodName =
  | 'getAll'
  | 'getOne'
  | 'getRelationship'
  | 'getDirectAll'
  | 'getDirectOne'
  | 'deleteOne'
  | 'deleteRelationship'
  | 'postOne'
  | 'postRelationship'
  | 'patchOne'
  | 'patchRelationship';
