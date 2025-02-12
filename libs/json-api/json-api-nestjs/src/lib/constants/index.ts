export * from './default';
export * from './di';
export * from './reflection';

export const JSON_API_CONTROLLER_POSTFIX = 'JsonApiController';
export const JSON_API_MODULE_POSTFIX = 'JsonApiModule';

export const PARAMS_RESOURCE_ID = 'id';
export const PARAMS_RELATION_ID = 'relId';
export const PARAMS_RELATION_NAME = 'relName';

export const DESC = 'DESC';
export const ASC = 'ASC';
export const SORT_TYPE = [DESC, ASC] as const;
