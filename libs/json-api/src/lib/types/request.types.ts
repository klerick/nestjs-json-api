export const enum SortDirection {
  DESC = 'DESC',
  ASC = 'ASC'
}

export type Pagination = {
  number: number,
  size: number
}

export type FilterRule = {
  [key: string]: string | string[];
}

export type Filters = {
  [key: string]: FilterRule
};

export type Includes = string[];

export type SortRules = {
  [key: string]: SortDirection
}

export const enum QueryField {
  filter = 'filter',
  sort = 'sort',
  include = 'include',
  page = 'page'
}

export interface QueryParams {
  [QueryField.filter]: Filters,
  [QueryField.include]: Includes,
  [QueryField.sort]: SortRules,
  [QueryField.page]: Pagination,
  needAttribute?: boolean
}

export interface RouteParams {
  id?: number;
  relName?: string;
  relId?: number;
}

export type RequestRelationshipsData = RequestRelationshipsObject['data'];
export type RequestResourceData = RequestResourceObject['data'];

export interface RequestResourceObject {
  data: {
    attributes: RequestAttributesObject;
    relationships: {
      [key: string]: RequestRelationshipsObject,
    };
  } & BaseData
}

export interface RequestRelationshipsObject {
  data: BaseData | BaseData[];
}

export interface RequestAttributesObject {
  [key: string]: any;
}

export interface BaseData {
  type: string;
  id: string;
  attributes?: RequestAttributesObject
}
