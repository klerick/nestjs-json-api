import { PartialByKeys } from './utils';
import { HttpInnerClient } from './http-inner-client';

export type JsonApiSdkConfig = {
  apiHost: string;
  apiPrefix?: string;
  idKey: string;
  idIsNumber?: boolean;
  operationUrl?: string;
  dateFields: string[];
};

export type JsonSdkConfig = PartialByKeys<
  JsonApiSdkConfig,
  'idKey' | 'apiPrefix' | 'idIsNumber' | 'dateFields' | 'operationUrl'
>;

export type JsonConfig = JsonSdkConfig & {
  adapter?: HttpInnerClient;
};
