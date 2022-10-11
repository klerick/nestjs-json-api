import { ParseIntPipe } from '@nestjs/common';
import { ConfigParam } from '../types';

export const DEFAULT_QUERY_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_CONNECTION_NAME = 'default';

export const ConfigParamDefault: ConfigParam = {
  debug: true,
  maxExecutionTime: 5000,
  requiredSelectField: true,
  pipeForId: ParseIntPipe,
};
