import { EntityTarget, ObjectLiteral } from '../../../types';

import {
  EntityRelation,
  ResourceObject,
  ResourceObjectRelationships,
} from '../../../utils/nestjs-shared';
import {
  PatchData,
  PatchRelationshipData,
  PostData,
  PostRelationshipData,
  Query,
  QueryOne,
} from '../zod';

export interface OrmService<E extends ObjectLiteral> {
  getAll(query: Query<E>): Promise<ResourceObject<E, 'array'>>;
  getOne(id: number | string, query: QueryOne<E>): Promise<ResourceObject<E>>;
  deleteOne(id: number | string): Promise<void>;
  postOne(inputData: PostData<E>): Promise<ResourceObject<E>>;
  patchOne(
    id: number | string,
    inputData: PatchData<E>
  ): Promise<ResourceObject<E>>;
  getRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel
  ): Promise<ResourceObjectRelationships<E, Rel>>;
  postRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>>;
  deleteRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<void>;
  patchRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>>;
}

export type FindOneRowEntity<E extends ObjectLiteral> = (
  entity: EntityTarget<E>,
  params: number | string
) => Promise<E | null>;

export type CheckRelationNme<E extends ObjectLiteral> = (
  entity: EntityTarget<E>,
  params: string
) => boolean;
