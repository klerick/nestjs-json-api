import { MethodName } from '../modules/mixin/types';

export const JSON_API_CONTROLLER_POSTFIX = 'JsonApiController';
export const JSON_API_MODULE_POSTFIX = 'JsonApiModule';
export const DEFAULT_CONNECTION_NAME = 'default';
export const ORM_SERVICE_PROPS = Symbol('ORM_SERVICE_PROPS');
export const PARAMS_RESOURCE_ID = 'id';
export const PARAMS_RELATION_NAME = 'relName';
export const DESC = 'DESC';
export const ASC = 'ASC';

export const SORT_TYPE = [DESC, ASC] as const;
export const METHOD_NAME: {
  [P in MethodName]: P;
} = {
  getAll: 'getAll',
  getOne: 'getOne',
  deleteOne: 'deleteOne',
  deleteRelationship: 'deleteRelationship',
  postOne: 'postOne',
  getRelationship: 'getRelationship',
  patchOne: 'patchOne',
  patchRelationship: 'patchRelationship',
  postRelationship: 'postRelationship',
};
