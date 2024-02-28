export * from './entity';
export * from './query-params';
export * from './response-body';
export * from './utils';
export * from './promise-json-api-sdk';
export * from './atomic';
export * from './filter-operand';
export * from './http-inner-client';

import { BodyType } from '../utils';
import {
  Attributes,
  Relationships,
  ResourceObject,
  ResourceObjectRelationships,
} from './response-body';
import { PartialByKeys } from './utils';
import { KEY_MAIN_INPUT_SCHEMA, KEY_MAIN_OUTPUT_SCHEMA } from '../constants';

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

type MainData<E> = {
  type: string;
  attributes: Attributes<E>;
  relationships?: Relationships<E>;
};
export type PostData<E> = {
  data: MainData<E>;
};

export type PatchData<E> = {
  data: { id: string } & MainData<E>;
};
export type RelationData = { id: string; type: string };
export type RelationBodyData = {
  data: RelationData | RelationData[];
};

export type AtomicBody = {
  [KEY_MAIN_INPUT_SCHEMA]: BodyType[];
};

type ResponseData<T extends unknown[]> = {
  [K in keyof T]: T[K] extends string | string[]
    ? ResourceObjectRelationships<T[K], any>
    : ResourceObject<T[K]>;
};

export type AtomicResponse<R extends unknown[]> = {
  [KEY_MAIN_OUTPUT_SCHEMA]: ResponseData<R>;
};
