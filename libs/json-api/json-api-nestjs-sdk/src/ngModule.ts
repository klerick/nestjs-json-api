export { FilterOperand, ResourceObject } from '@klerick/json-api-nestjs-shared';

export {
  AtomicFactory,
  provideJsonApi,
  JSON_API_SDK_CONFIG,
  getProviders,
  JsonSdkConfigFactory,
  JsonSdkConfigOrFactory,
  JsonSdkAngularConfig,
  createHttpInnerClient,
} from './lib/json-api-angular.js';
export { JsonApiUtilsService, JsonApiSdkService } from './lib/service/index.js';
// Angular consumers take their services from this entry point; the readers
// belong beside them rather than behind a second import path.
export { getResourceMeta, getDocumentMeta } from './lib/utils/index.js';
export type { ResourceMeta } from './lib/utils/index.js';
export { AtomicOperations, JsonSdkConfig } from './lib/types/index.js';
