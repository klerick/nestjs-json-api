import { Writeable, z, ZodArray, ZodEffects, ZodEnum } from 'zod';
import { uniqueArray } from '../zod-utils';

export type ZodIncludeQuerySchema<U extends readonly [string, ...string[]]> =
  ZodEffects<
    ZodArray<ZodEnum<Writeable<U>>, 'atleastone'>,
    [Writeable<U>[number], ...Writeable<U>[number][]],
    [Writeable<U>[number], ...Writeable<U>[number][]]
  >;

export const zodIncludeQuerySchema = <U extends readonly [string, ...string[]]>(
  relationList: U
): ZodIncludeQuerySchema<U> =>
  z.enum(relationList).array().nonempty().refine(uniqueArray(), {
    message: 'Include should have unique relation',
  });
