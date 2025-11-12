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
    query: Query<E, IdKey>,
  ): Promise<ResourceObject<E, 'array', null, IdKey>>;
  getAll(
    query: Query<E, IdKey>,
    transformData?: boolean,
    additionalQueryParams?: Record<string, unknown>
  ): Promise<ResourceObject<E, 'array', null, IdKey> | { totalItems: number; items: E[] }>;
  getOne(
    id: number | string,
    query: QueryOne<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>>;
  getOne(
    id: number | string,
    query: QueryOne<E, IdKey>,
    transformData?: boolean,
    additionalQueryParams?: Record<string, unknown>
  ): Promise<ResourceObject<E, 'object', null, IdKey> | E>;
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

  loadRelations(
    relationships: PatchData<E, IdKey>['relationships'] | PostData<E, IdKey>['relationships'],
  ): Promise<{
    [K in RelationKeys<E>]: E[K];
  }>;
}
