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
  in = 'in',
  like = 'like',
  lt = 'lt',
  lte = 'lte',
  ne = 'ne',
  nin = 'nin',
  regexp = 'regexp',
  some = 'some',
}
