import { pgConfig } from './config-pg';

export const config = {
  ...pgConfig,
  contextName: 'default',
  // @ts-ignore
  registerRequestContext: false
};
