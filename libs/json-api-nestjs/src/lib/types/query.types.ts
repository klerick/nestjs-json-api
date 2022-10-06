import {FilterOperand} from '../types-common/operand';
import {ElementType, EntityProps, EntityRelation} from '../types-common/common';

export type SortType = 'ASC' | 'DESC';

export {
  FilterOperand
}

export type SortRules<T> = {
  [P in EntityRelation<T>]?: Partial<{
    [K in EntityProps<ElementType<T[P]>>]?: SortType
  }>
} & {
  target: Partial<{
    [P in EntityProps<T>]?: SortType
  }>
}

export type Pagination = {
  number: number,
  size: number
}

export type Includes<T> = EntityRelation<T>[];

export type Fields<T> = {
  [P in EntityRelation<T>]: Partial<EntityProps<ElementType<T[P]>>>[]
} & {
  target: Partial<EntityProps<ElementType<T>>>[]
}

type MapFilterOperandTypeString = Exclude<
  FilterOperand,
  FilterOperand.in | FilterOperand.nin | FilterOperand.some
  >;

type OneKey<K extends string, V = any> = {
  [P in K]: (Record<P, V> &
    Partial<Record<Exclude<K, P>, never>>) extends infer O
    ? { [Q in keyof O]: O[Q] }
    : never
}[K];

export type Operands = {
  [P in FilterOperand]: (Record<P, P extends MapFilterOperandTypeString ? string : string[]> &
    Partial<Record<Exclude<FilterOperand, P>, never>>) extends infer O
    ? { [Q in keyof O]: O[Q] }
    : never
}[FilterOperand];


export type OperandsRelation = {
  [P in Extract<FilterOperand, FilterOperand.eq |  FilterOperand.ne>]: (Record<P, string> &
    Partial<Record<Exclude<Extract<FilterOperand, FilterOperand.eq |  FilterOperand.ne>, P>, never>>) extends infer O
    ? { [Q in keyof O]: O[Q] }
    : never
}[Extract<FilterOperand, FilterOperand.eq |  FilterOperand.ne>];


export type Filter<T> = {
  target: Partial<{
    [P in EntityProps<T>]?: Operands;
  } & {
    [P in EntityRelation<T>]?: OperandsRelation
  }> | null;
  relation: Partial<{
    [P in EntityRelation<T>]?: {
      [key in EntityProps<ElementType<T[P]>>]?: Operands;
    };
  }> | null;
};

export const enum QueryField {
  filter = 'filter',
  sort = 'sort',
  include = 'include',
  page = 'page',
  needAttribute = 'needAttribute',
  fields = 'fields'
}

export interface QueryParams<T> {
  [QueryField.filter]: Filter<T>,
  [QueryField.include]: Partial<Includes<T>> | null,
  [QueryField.sort]: Partial<SortRules<T>> | null,
  [QueryField.page]: Pagination,
  [QueryField.needAttribute]: boolean,
  [QueryField.fields]: Partial<Fields<T>> | null
}

export type QuerySchemaTypes = {
  [QueryField.page]?: {
    number?: string,
    size?: string,
  }
  [QueryField.sort]?: string,
  [QueryField.include]?: string,
  [QueryField.fields]?: {
    [key: string]: string
  },
  [QueryField.filter]?: Partial<{
    [key: string]: Partial<{
      [key in FilterOperand]: string
    }> | string
  }>
  [QueryField.needAttribute]?: boolean
}
