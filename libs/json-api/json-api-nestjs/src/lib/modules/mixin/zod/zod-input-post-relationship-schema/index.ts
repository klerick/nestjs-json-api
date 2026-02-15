import { z } from 'zod';

import { zodData, zodMeta } from '../zod-share';

export const zodPostRelationship = z
  .strictObject({
    data: z.union([zodData(), zodData().array().nonempty()]),
    meta: zodMeta,
  });

export type ZodPostRelationship = typeof zodPostRelationship;
export type PostRelationship = z.infer<ZodPostRelationship>;
export type PostRelationshipData = PostRelationship['data'];
