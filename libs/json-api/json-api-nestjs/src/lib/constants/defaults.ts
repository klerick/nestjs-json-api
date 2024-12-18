import { ParseIntPipe } from '@nestjs/common';
import { ConfigParam } from '../types';

export const DESC = 'DESC';
export const ASC = 'ASC';

export const SORT_TYPE = [DESC, ASC] as const;

export const DEFAULT_QUERY_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_CONNECTION_NAME = 'default';

export const TYPEORM_SERVICE_PROPS = Symbol('typeormService');

export const SUB_QUERY_ALIAS_FOR_PAGINATION = 'subQueryWithLimitOffset';
export const ALIAS_FOR_PAGINATION = 'aliasForPagination';

export const ConfigParamDefault: ConfigParam = {
  debug: true,
  requiredSelectField: true,
  pipeForId: ParseIntPipe,
  useSoftDelete: false,
};
