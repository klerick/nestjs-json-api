import { getAll } from './get-all/get-all';
import { getOne } from './get-one/get-one';
import { deleteOne } from './delete-one/delete-one';
import { postOne } from './post-one/post-one';
import { patchOne } from './patch-one/patch-one';
import { getRelationship } from './get-relationship/get-relationship';
import { postRelationship } from './post-relationship/post-relationship';
import { deleteRelationship } from './delete-relationship/delete-relationship';
import { patchRelationship } from './patch-relationship/patch-relationship';
import { Entity, EntityRelation } from '../../../types';

export const MethodsService = {
  getAll,
  getOne,
  deleteOne,
  postOne,
  patchOne,
  getRelationship,
  postRelationship,
  deleteRelationship,
  patchRelationship,
};

export type MethodsService<E extends Entity> = {
  getAll: (
    ...arg: Parameters<typeof getAll<E>>
  ) => ReturnType<typeof getAll<E>>;
  getOne: (
    ...arg: Parameters<typeof getOne<E>>
  ) => ReturnType<typeof getOne<E>>;
  deleteOne: (
    ...arg: Parameters<typeof deleteOne<E>>
  ) => ReturnType<typeof deleteOne<E>>;
  postOne: (
    ...arg: Parameters<typeof postOne<E>>
  ) => ReturnType<typeof postOne<E>>;
  patchOne: (
    ...arg: Parameters<typeof patchOne<E>>
  ) => ReturnType<typeof patchOne<E>>;
  getRelationship: <Rel extends EntityRelation<E>>(
    ...arg: Parameters<typeof getRelationship<E, Rel>>
  ) => ReturnType<typeof getRelationship<E, Rel>>;
  postRelationship: <Rel extends EntityRelation<E>>(
    ...arg: Parameters<typeof postRelationship<E, Rel>>
  ) => ReturnType<typeof postRelationship<E, Rel>>;
  deleteRelationship: <Rel extends EntityRelation<E>>(
    ...arg: Parameters<typeof deleteRelationship<E, Rel>>
  ) => ReturnType<typeof deleteRelationship<E, Rel>>;
  patchRelationship: <Rel extends EntityRelation<E>>(
    ...arg: Parameters<typeof patchRelationship<E, Rel>>
  ) => ReturnType<typeof patchRelationship<E, Rel>>;
};
