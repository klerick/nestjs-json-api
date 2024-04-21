import { Entity } from '../../../types';
import { ZodAttributesSchema } from '../zod-input-post-schema/attributes';
import { ZodTypeSchema } from '../zod-input-post-schema/type';
import { ZodIdSchema } from '../zod-input-post-schema/id';

import { ZodDefault, ZodObject, ZodOptional } from 'zod';
import {
  ZodPatchRelationshipsSchema,
  zodPatchRelationshipsSchema,
} from './relationships';

export type PatchShape<E extends Entity> = {
  id: ZodIdSchema;
  type: ZodTypeSchema<string>;
  attributes: ZodDefault<ZodOptional<ZodAttributesSchema<E>>>;
  relationships: ZodPatchRelationshipsSchema<E>;
};

export type PatchShapeDefault<E extends Entity> = {
  id: ZodIdSchema;
  type: ZodTypeSchema<string>;
  attributes: ZodAttributesSchema<E>;
  relationships: ZodOptional<ZodPatchRelationshipsSchema<E>>;
};

export type ZodPatchData<E extends Entity> = ZodObject<PatchShape<E>, 'strict'>;
export { zodPatchRelationshipsSchema };
