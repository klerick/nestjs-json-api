import { ZodObject, ZodOptional } from 'zod';

import { Entity } from '../../../types';

import { zodAttributesSchema, ZodAttributesSchema } from './attributes';
import { zodTypeSchema, ZodTypeSchema } from './type';
import {
  zodRelationshipsSchema,
  ZodRelationshipsSchema,
} from './relationships';

export type PostShape<E extends Entity> = {
  attributes: ZodAttributesSchema<E>;
  type: ZodTypeSchema<string>;
  relationships: ZodOptional<ZodRelationshipsSchema<E>>;
};

export type ZodPostData<E extends Entity> = ZodObject<PostShape<E>, 'strict'>;

export { zodAttributesSchema, zodTypeSchema, zodRelationshipsSchema };
