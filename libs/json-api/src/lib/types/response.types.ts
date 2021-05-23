import { BaseData } from '../types';

export interface ResponseRelationshipsObject {
  data?: BaseData | BaseData[];
  links?: ResponseLinksData;
}

export interface ResponseResourceObject {
  included?: ResponseResourceData[];
  meta?: ResponseResourceMeta;
  data: ResponseResourceData | ResponseResourceData[];
}

export interface ResponseAttributesObject {
  [key: string]: any;
}

export interface ResponseResourceData extends BaseData, ResponseLinksData {
  attributes: ResponseAttributesObject;
  relationships: {
    [key: string]: ResponseRelationshipsObject,
  };
}

export interface ResponseResourceMeta {
  totalItems: number,
  pageNumber: number,
  pageSize: number,
}

export interface ResponseLinksData {
  related?: string;
  self?: string;
}

