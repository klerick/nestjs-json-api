import { z, ZodLiteral } from 'zod';

export type ZodTypeSchema<T extends string> = ZodLiteral<T>;
export const zodTypeSchema = <T extends string>(type: T) => z.literal(type);
