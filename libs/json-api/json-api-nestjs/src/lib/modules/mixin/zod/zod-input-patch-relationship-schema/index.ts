import { z } from 'zod';

import { zodData } from '../zod-share';

// Общая схема для data в relationship запросах
export const zodRelationshipData = z
  .union([zodData().nullable(), zodData().array()])
  .meta({ id: 'RelationshipData' });

export const zodPatchRelationship = z
  .strictObject({
    data: zodRelationshipData,
  })
  .meta({ id: 'PatchRelationshipBody' });

export type ZodPatchRelationship = typeof zodPatchRelationship;
export type PatchRelationship = z.infer<ZodPatchRelationship>;
export type PatchRelationshipData = PatchRelationship['data'];
