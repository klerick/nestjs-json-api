import { z } from 'zod';

export const zodMeta = z
  .record(z.string(), z.unknown())
  .optional()
  .meta({ id: 'MetaObject' });

export const zodMetaExtractor = z
  .object({
    meta: zodMeta,
  })
  .loose()
  .transform((val) => val.meta ?? {});

export type ZodMeta = typeof zodMeta;
export type ZodMetaExtractor = typeof zodMetaExtractor;
export type Meta = z.infer<ZodMeta>;