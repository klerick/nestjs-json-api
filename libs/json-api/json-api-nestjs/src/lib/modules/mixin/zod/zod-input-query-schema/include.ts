import { z } from 'zod';
import { isString } from '../../../../utils/nestjs-shared';
import { ZodInfer } from '../../types';

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

export type ZodIncludeInputQuery = ZodInfer<typeof zodIncludeInputQuery>;
