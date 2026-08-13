export {
  FilterOperand,
  ResourceObject,
  QueryField,
} from '@klerick/json-api-nestjs-shared';

export { JsonApiUtilsService, JsonApiSdkService } from './lib/service/index.js';
export * from './lib/json-api-js.js';
export { adapterForAxios, nullRef, emptyArrayRef } from './lib/utils/index.js';
export { AtomicOperations, Operands, QueryParams, JsonConfig, Filter, Includes, Sort, Pagination, Fields, EntityChain, PromiseEntityChain } from './lib/types/index.js';
