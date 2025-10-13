import { z } from 'zod';

import { zodData } from '../zod-share';

export const zodPatchRelationship = z
  .strictObject({
    data: z.union([zodData().nullable(), zodData().array()]),
  });

export type ZodPatchRelationship = typeof zodPatchRelationship;
export type PatchRelationship = z.infer<ZodPatchRelationship>;
export type PatchRelationshipData = PatchRelationship['data'];
