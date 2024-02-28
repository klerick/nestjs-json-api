import { z, ZodArray, ZodObject, ZodString, ZodUnion } from 'zod';

export type Data = ZodObject<
  {
    type: ZodString;
    id: ZodString;
  },
  'strict'
>;
export const data: Data = z
  .object({
    type: z.string(),
    id: z.string(),
  })
  .strict();

export type PostRelationshipSchema = ZodUnion<
  [Data, ZodArray<Data, 'atleastone'>]
>;
export const postRelationshipSchema: PostRelationshipSchema = z.union([
  data,
  z.array(data).nonempty(),
]);
