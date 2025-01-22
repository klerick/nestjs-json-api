import { z } from 'zod';

export function zodType<T extends string>(type: T) {
  return z.literal(type);
}

export type ZodType<T extends string> = ReturnType<typeof zodType<T>>;
export type Type<T extends string> = z.infer<ZodType<T>>;
