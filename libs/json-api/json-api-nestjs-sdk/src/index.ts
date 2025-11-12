export {
  FilterOperand,
  ResourceObject,
  QueryField,
} from '@klerick/json-api-nestjs-shared';

export { JsonApiUtilsService, JsonApiSdkService } from './lib/service';
export * from './lib/json-api-js';
export { adapterForAxios } from './lib/utils';
export { AtomicOperations, Operands, QueryParams, JsonConfig, Filter, Includes, Sort, Pagination, Fields } from './lib/types';
