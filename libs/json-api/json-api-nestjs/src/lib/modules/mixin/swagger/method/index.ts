import { getAll } from './get-all';
import { getOne } from './get-one';
import { deleteOne } from './delete-one';
import { postOne } from './post-one';
import { patchOne } from './patch-one';
import { getRelationship } from './get-relationship';
import { deleteRelationship } from './delete-relationship';
import { postRelationship } from './post-relationship';
import { patchRelationship } from './patch-relationship';

import { OrmService } from '../../types';

export const swaggerMethod = {
  getAll,
  getOne,
  deleteOne,
  postOne,
  patchOne,
  getRelationship,
  deleteRelationship,
  postRelationship,
  patchRelationship,
} as const;

export type SwaggerMethod<E extends object> = {
  [Key in keyof OrmService<E>]?: (typeof swaggerMethod)[Key];
};
