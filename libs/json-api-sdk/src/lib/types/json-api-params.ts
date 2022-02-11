import { ElementType, EntityProps, EntityRelation } from './common';
import { FilterOperand } from 'json-api-nestjs/filter-operand';

type MapFilterOperandTypeString = Exclude<
  FilterOperand,
  FilterOperand.in | FilterOperand.nin
>;
export type Operands = {
  [P in FilterOperand]?: P extends MapFilterOperandTypeString ? string : string[];
};

export type SortType = 'ASC' | 'DESC';

type Sort<T> = {
  [key in EntityProps<T>]?: SortType;
};

export type Field<T> = {
  [P in EntityRelation<T>]?: EntityProps<ElementType<T[P]>>[];
} & { current?: EntityProps<T>[] };


type Filter<T> = {
  target: {
    [P in EntityProps<T>]?: Operands;
  };
  relation?: {
    [P in EntityRelation<T>]?: {
      [key in EntityProps<ElementType<T[P]>>]?: Operands;
    };
  };
};

export type QueryParams<T> = {
  include?: EntityRelation<T>[];
  sort?: Sort<T>;
  pagination?: {
    number?: number;
    size?: number;
  };
  field?: Field<T>;
  filter?: Filter<T>;
}
