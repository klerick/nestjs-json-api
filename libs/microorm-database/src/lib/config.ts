import { pgConfig } from './config-pg';
import { ClsServiceManager } from 'nestjs-cls';
import { EntityManager } from '@mikro-orm/core';
import { DatabaseLoggerService } from './database-logger.service';
import type { LoggerOptions } from '@mikro-orm/core';
export const CONTEXT_STORE_NAME = Symbol('mikroorm-database');

export const config = {
  ...pgConfig,
  contextName: 'default',
  loggerFactory: (options: LoggerOptions) => new DatabaseLoggerService(options),
  context: () => ClsServiceManager.getClsService().get<EntityManager>(CONTEXT_STORE_NAME),
  // @ts-ignore
  registerRequestContext: false,
  forceUtcTimezone: true,
};
