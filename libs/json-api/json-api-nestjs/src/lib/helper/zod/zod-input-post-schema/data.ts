import { z, ZodEffects, ZodObject } from 'zod';

import { ZodTypeSchema, zodTypeSchema } from './type';
import { ZodIdSchema, zodIdSchema } from './id';
import { TypeForId } from '../../orm';
import { nonEmptyObject } from '../zod-utils';

export type ZodDataSchema<S extends string> = ZodEffects<
  ZodObject<{
    id: ZodIdSchema;
    type: ZodTypeSchema<S>;
  }>
>;
export const zodDataSchema = (
  type: string,
  typeId: TypeForId
): ZodDataSchema<string> =>
  z
    .object({
      id: zodIdSchema(typeId),
      type: zodTypeSchema(type),
    })
    .strict()
    .refine(nonEmptyObject);
