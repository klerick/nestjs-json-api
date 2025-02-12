import { FilterOperand } from '../../shared';

export { FilterOperand };

export type FilterOperandForString = Exclude<
  FilterOperand,
  FilterOperand.in | FilterOperand.nin | FilterOperand.some
>;

export type Operands = {
  [P in FilterOperand]?: P extends FilterOperandForString ? string : string[];
};

export type OperandsRelation =
  | {
      [FilterOperand.eq]: null;
    }
  | {
      [FilterOperand.ne]: null;
    };
