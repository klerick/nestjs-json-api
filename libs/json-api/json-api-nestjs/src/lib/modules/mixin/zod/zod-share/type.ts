import { z, ZodNullable, ZodOptional, ZodType as InnerZodType } from 'zod';

export function zodType<T extends string>(type: T) {
  return z.literal(type);
}

export type ZodType<T extends string> = ReturnType<typeof zodType<T>>;
export type Type<T extends string> = z.infer<ZodType<T>>;

type ResultPatchSchema<
  Schema extends InnerZodType,
  Null extends true | false
> = Null extends true ? ZodOptional<ZodNullable<Schema>> : ZodOptional<Schema>;

type ResultPostSchema<
  Schema extends InnerZodType,
  Null extends true | false
> = Null extends true ? ZodOptional<ZodNullable<Schema>> : Schema;

export type ResultSchema<
  Schema extends InnerZodType,
  Null extends true | false,
  isPatch extends true | false
> = isPatch extends true
  ? ResultPatchSchema<Schema, Null>
  : ResultPostSchema<Schema, Null>;
