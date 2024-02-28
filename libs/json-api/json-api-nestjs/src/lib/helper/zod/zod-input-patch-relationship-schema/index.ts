import { z, ZodArray, ZodNullable, ZodUnion } from 'zod';

import { Data, data } from '../zod-input-post-relationship-schema';

export type PatchRelationshipSchema = ZodUnion<
  [ZodNullable<Data>, ZodArray<Data>]
>;
export const patchRelationshipSchema: PatchRelationshipSchema = z.union([
  data.nullable(),
  z.array(data),
]);
