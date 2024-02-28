import { z, ZodDefault, ZodEffects, ZodNumber, ZodObject } from 'zod';
import { DEFAULT_PAGE_SIZE, DEFAULT_QUERY_PAGE } from '../../../constants';

export type ZodPageQuerySchema = ZodDefault<
  ZodObject<
    {
      size: ZodEffects<ZodDefault<ZodNumber>, number, unknown>;
      number: ZodEffects<ZodDefault<ZodNumber>, number, unknown>;
    },
    'strict'
  >
>;

const checkNumber = (a: unknown) => {
  if (typeof a === 'string') {
    return parseInt(a, 10);
  } else if (typeof a === 'number') {
    return a;
  } else {
    return undefined;
  }
};
export const zodPageQuerySchema: ZodPageQuerySchema = z
  .object({
    size: z.preprocess(
      checkNumber,
      z.number().int().min(1).default(DEFAULT_PAGE_SIZE)
    ),
    number: z.preprocess(
      checkNumber,
      z.number().int().min(1).default(DEFAULT_QUERY_PAGE)
    ),
  })
  .strict()
  .default({
    size: DEFAULT_PAGE_SIZE,
    number: DEFAULT_QUERY_PAGE,
  });
