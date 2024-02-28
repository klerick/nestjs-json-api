import { z, ZodString } from 'zod';

export type ZodSortInputQuerySchema = ZodString;
export const zodSortInputQuerySchema: ZodSortInputQuerySchema = z.string();
