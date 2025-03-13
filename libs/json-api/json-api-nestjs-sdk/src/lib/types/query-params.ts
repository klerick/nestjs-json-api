import {
  QueryField,
  RelationKeys,
  PropertyKeys,
  TypeOfArray,
} from '@klerick/json-api-nestjs-shared';

import { Operands, OperandsRelation } from './filter-operand';
export type SortType = 'ASC' | 'DESC';

export type Includes<T> = RelationKeys<T>[];

type TargetField<E> = {
  target?: PropertyKeys<E>[];
};

type RelationField<E> = {
  [K in RelationKeys<E>]?: PropertyKeys<TypeOfArray<E[K]>>[];
};

type SortForEntity<E> = {
  [K in PropertyKeys<E>]?: SortType;
};

type TargetSort<E> = {
  target?: SortForEntity<E>;
};

type RelationSort<E> = {
  [K in RelationKeys<E>]?: SortForEntity<TypeOfArray<E[K]>>;
};

type Sort<E> = TargetSort<E> & RelationSort<E>;

type Fields<E> = TargetField<E> & RelationField<E>;

export type Pagination = {
  number: number;
  size: number;
};

type TargetRelationFilter<E> = {
  [P in RelationKeys<E>]?: OperandsRelation;
};

type EntityFilter<E> = {
  [K in PropertyKeys<E>]?: Operands;
};

type TargetFilter<E> = {
  target: EntityFilter<E> & TargetRelationFilter<E>;
};

type RelationFilter<E> = {
  [K in RelationKeys<E>]?: EntityFilter<TypeOfArray<E[K]>>;
};

export type Filter<T> = TargetFilter<T> & RelationFilter<T>;

export type QueryParams<E> = {
  [QueryField.filter]?: Filter<E>;
  [QueryField.include]?: Includes<E>;
  [QueryField.sort]?: Sort<E>;
  [QueryField.page]?: Pagination;
  [QueryField.fields]?: Fields<E>;
};

export type QueryParamsForOneItem<T> = Pick<
  QueryParams<T>,
  QueryField.include | QueryField.filter | QueryField.fields
>;
