export enum QueryField {
  filter = 'filter',
  sort = 'sort',
  include = 'include',
  page = 'page',
  fields = 'fields',
}

export enum FilterOperand {
  eq = 'eq',
  gt = 'gt',
  gte = 'gte',
  like = 'like',
  lt = 'lt',
  lte = 'lte',
  ne = 'ne',
  regexp = 'regexp',
  in = 'in',
  nin = 'nin',
  some = 'some',
}

export enum FilterOperandOnlyInNin {
  in = 'in',
  nin = 'nin',
}
export enum FilterOperandOnlySimple {
  eq = 'eq',
  gt = 'gt',
  gte = 'gte',
  like = 'like',
  lt = 'lt',
  lte = 'lte',
  ne = 'ne',
  regexp = 'regexp',
}
