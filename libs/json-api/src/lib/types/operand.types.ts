export enum FilterOperand {
  eq = 'eq',
  gt = 'gt',
  gte = 'gte',
  in = 'in',
  like = 'like',
  lt = 'lt',
  lte = 'lte',
  ne = 'ne',
  nin = 'nin',
  regexp = 'regexp',
  some = 'some',
}

export type ConvertedFilter =
  {
    condition: string,
    parameters: {
      [key: string]: any;
    },
    type: 'where' | 'andWhere'
  }[]

export type ReversOperand =
  | '= :EXPRESSION'
  | '> :EXPRESSION'
  | '>= :EXPRESSION'
  | 'IN (:...EXPRESSION)'
  | 'LIKE %:EXPRESSION%'
  | '< :EXPRESSION'
  | '<= :EXPRESSION'
  | '<> :EXPRESSION'
  | 'NOT IN (:...EXPRESSION)'
  | 'REGEXP '
  | '&& :EXPRESSION';

export const OperandsMap = {
  [FilterOperand.eq]: '= :EXPRESSION',
  [FilterOperand.regexp]: '~* :EXPRESSION',
  [FilterOperand.gt]: '> :EXPRESSION',
  [FilterOperand.gte]: '>= :EXPRESSION',
  [FilterOperand.in]: 'IN (:...EXPRESSION)',
  [FilterOperand.like]: 'ILIKE :EXPRESSION',
  [FilterOperand.lt]: '< :EXPRESSION',
  [FilterOperand.lte]: '<= :EXPRESSION',
  [FilterOperand.ne]: '<> :EXPRESSION',
  [FilterOperand.nin]: 'NOT IN (:...EXPRESSION)',
  [FilterOperand.some]: '&& :EXPRESSION',
};
