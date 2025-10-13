import { createErrorMap } from 'zod-validation-error';
import { z } from 'zod';

z.config({
  customError: createErrorMap(),
});

export * from './zod-input-query-schema';
export * from './zod-query-schema';
export * from './zod-input-post-schema';
export * from './zod-input-patch-schema';
export * from './zod-input-post-relationship-schema';
export * from './zod-input-patch-relationship-schema';
export * from './map-transform-to-json-shema'

export { Relationships, Data, Attributes, Id, Type } from './zod-share';
