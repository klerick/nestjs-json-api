import { isString } from '@klerick/json-api-nestjs-shared';
import { z } from 'zod';

export function zodIncludeInputQuery() {
  return z
    .string()
    .optional()
    .transform((data) => {
      if (!data || !isString(data)) return null;
      return data
        .split(',')
        .map((i) => i.trim())
        .filter((i) => !!i);
    });
}

export type ZodIncludeInputQuery = z.infer<
  ReturnType<typeof zodIncludeInputQuery>
>;
