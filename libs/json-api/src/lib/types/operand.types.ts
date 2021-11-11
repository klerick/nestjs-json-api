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
  | '= :&'
  | '> :&'
  | '>= :&'
  | 'IN (:...&)'
  | 'LIKE %:&%'
  | '< :&'
  | '<= :&'
  | '<> :&'
  | 'NOT IN (:...&)'
  | 'REGEXP ';

export const OperandsMap = {
  [FilterOperand.eq]: '= :&',
  [FilterOperand.regexp]: '~* :&',
  [FilterOperand.gt]: '> :&',
  [FilterOperand.gte]: '>= :&',
  [FilterOperand.in]: 'IN (:...&)',
  [FilterOperand.like]: 'ILIKE :&',
  [FilterOperand.lt]: '< :&',
  [FilterOperand.lte]: '<= :&',
  [FilterOperand.ne]: '<> :&',
  [FilterOperand.nin]: 'NOT IN (:...&)',
};
