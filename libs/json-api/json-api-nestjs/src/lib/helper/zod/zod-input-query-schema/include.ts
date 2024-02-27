// export {
//   ZodIncludeQuerySchema as ZodIncludeInputQuerySchema,
//   zodIncludeQuerySchema as zodIncludeInputQuerySchema,
// } from '../zod-query-schema/index';

import { z, ZodString } from 'zod';

export type ZodIncludeInputQuerySchema = ZodString;
export const zodIncludeInputQuerySchema = z.string().min(1);
