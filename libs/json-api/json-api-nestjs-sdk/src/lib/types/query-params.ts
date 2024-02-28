import { QueryField } from 'json-shared-type';
import { EntityProps, EntityRelation } from './entity';
import { TypeOfArray } from './utils';
import { Operands, OperandsRelation } from './filter-operand';

export type SortType = 'ASC' | 'DESC';

export { QueryField };

export type Includes<T> = EntityRelation<T>[];

type TargetField<E> = {
  target?: EntityProps<E>[];
};

type RelationField<E> = {
  [K in EntityRelation<E>]?: EntityProps<TypeOfArray<E[K]>>[];
};

type SortForEntity<E> = {
  [K in EntityProps<E>]?: SortType;
};

type TargetSort<E> = {
  target?: SortForEntity<E>;
};

type RelationSort<E> = {
  [K in EntityRelation<E>]?: SortForEntity<TypeOfArray<E[K]>>;
};

type Sort<E> = TargetSort<E> & RelationSort<E>;

type Fields<E> = TargetField<E> & RelationField<E>;

export type Pagination = {
  number: number;
  size: number;
};

type TargetRelationFilter<E> = {
  [P in EntityRelation<E>]?: OperandsRelation;
};

type EntityFilter<E> = {
  [K in EntityProps<E>]?: Operands;
};

type TargetFilter<E> = {
  target: EntityFilter<E> & TargetRelationFilter<E>;
};

type RelationFilter<E> = {
  [K in EntityRelation<E>]?: EntityFilter<TypeOfArray<E[K]>>;
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
