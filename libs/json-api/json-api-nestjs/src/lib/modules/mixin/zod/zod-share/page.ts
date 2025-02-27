import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, DEFAULT_QUERY_PAGE } from '../../../../constants';

export function zodPageInputQuery() {
  return z
    .object({
      size: z
        .preprocess((x) => Number(x), z.number().int().min(1))
        .default(DEFAULT_PAGE_SIZE),
      number: z
        .preprocess((x) => Number(x), z.number().int().min(1))
        .default(DEFAULT_QUERY_PAGE),
    })
    .strict()
    .default({
      size: DEFAULT_PAGE_SIZE,
      number: DEFAULT_QUERY_PAGE,
    });
}

export type ZodPageInputQuery = ReturnType<typeof zodPageInputQuery>;
