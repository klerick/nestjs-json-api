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
export { AtomicOperations, JsonSdkConfig } from './lib/types/index.js';
