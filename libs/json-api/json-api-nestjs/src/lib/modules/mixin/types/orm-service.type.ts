import {
  ResourceObject,
  ResourceObjectRelationships,
  RelationKeys,
} from '@klerick/json-api-nestjs-shared';

import {
  PatchData,
  PatchRelationshipData,
  PostData,
  PostRelationshipData,
  Query,
  QueryOne,
} from '../zod';

export interface OrmService<E extends object, IdKey extends string = 'id'> {
  getAll(
    query: Query<E, IdKey>
  ): Promise<ResourceObject<E, 'array', null, IdKey>>;
  getOne(
    id: number | string,
    query: QueryOne<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>>;
  deleteOne(id: number | string): Promise<void>;
  patchOne(
    id: number | string,
    inputData: PatchData<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>>;
  postOne(
    inputData: PostData<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>>;

  getRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>>;
  postRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>>;

  deleteRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<void>;

  patchRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>>;
}
