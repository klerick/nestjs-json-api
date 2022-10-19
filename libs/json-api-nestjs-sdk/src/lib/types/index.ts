import {
  SortRules,
  Includes,
  Pagination,
  Fields,
  QueryField,
  EntityProps,
  Operands,
  OperandsRelation,
  EntityRelation,
  ElementType,
} from 'json-api-nestjs';

export declare type Filter<T> = {
  target?: Partial<
    {
      [P in EntityProps<T>]?: Operands;
    } & {
      [P in EntityRelation<T>]?: OperandsRelation;
    }
  >;
  relation?: Partial<{
    [P in EntityRelation<T>]?: {
      [key in EntityProps<ElementType<T[P]>>]?: Operands;
    };
  }>;
};

export interface QueryParams<T> {
  [QueryField.filter]?: Filter<T>;
  [QueryField.include]?: Includes<T>;
  [QueryField.sort]?: Partial<SortRules<T>>;
  [QueryField.page]?: Pagination;
  [QueryField.fields]?: Partial<Fields<T>>;
}

export type QueryParamsForOneItem<T> = Pick<
  QueryParams<T>,
  QueryField.include | QueryField.filter | QueryField.fields
>;
