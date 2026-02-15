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

import { OrmService, MethodName } from '../types';

import { ORM_SERVICE_PROPS } from '../../../constants';

type RequestMethodeObject<E extends object, Idkey extends string> = {
  [K in MethodName]: OrmService<E, Idkey>[K];
};

export class JsonBaseController<E extends object, IdKey extends string = 'id'>
  implements RequestMethodeObject<E, IdKey>
{
  private [ORM_SERVICE_PROPS]!: OrmService<E, IdKey>;

  getOne(
    id: string | number,
    query: QueryOne<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>> {
    return this[ORM_SERVICE_PROPS].getOne(id, query);
  }
  getAll(
    query: Query<E, IdKey>
  ): Promise<ResourceObject<E, 'array', null, IdKey>> {
    return this[ORM_SERVICE_PROPS].getAll(query);
  }
  deleteOne(id: string | number): Promise<void> {
    return this[ORM_SERVICE_PROPS].deleteOne(id);
  }

  // Method overloads for patchOne
  patchOne(
    id: string | number,
    inputData: PatchData<E, IdKey>,
    meta?: Record<string, unknown>
  ): Promise<ResourceObject<E, 'object', null, IdKey>>;
  patchOne(
    id: string | number,
    inputData: PatchData<E, IdKey>,
    meta: Record<string, unknown>
  ): Promise<ResourceObject<E, 'object', null, IdKey>>
  {
    return this[ORM_SERVICE_PROPS].patchOne(id, inputData);
  }

  // Method overloads for postOne
  postOne(
    inputData: PostData<E, IdKey>,
    meta?: Record<string, unknown>
  ): Promise<ResourceObject<E, 'object', null, IdKey>>;
  postOne(
    inputData: PostData<E, IdKey>,
    meta: Record<string, unknown>
  ): Promise<ResourceObject<E, 'object', null, IdKey>>
  {
    return this[ORM_SERVICE_PROPS].postOne(inputData);
  }

  getRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: string | number,
    relName: Rel
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
    return this[ORM_SERVICE_PROPS].getRelationship(id, relName);
  }

  // Method overloads for postRelationship
  postRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: string | number,
    relName: Rel,
    input: PostRelationshipData,
    meta?: Record<string, unknown>
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>>;
  postRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: string | number,
    relName: Rel,
    input: PostRelationshipData,
    meta: Record<string, unknown>
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>>
  {
    return this[ORM_SERVICE_PROPS].postRelationship(id, relName, input);
  }

  // Method overloads for deleteRelationship
  deleteRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: string | number,
    relName: Rel,
    input: PostRelationshipData,
    meta?: Record<string, unknown>
  ): Promise<void>;
  deleteRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: string | number,
    relName: Rel,
    input: PostRelationshipData,
    meta: Record<string, unknown>
  ): Promise<void>
  {
    return this[ORM_SERVICE_PROPS].deleteRelationship(id, relName, input);
  }

  // Method overloads for patchRelationship
  patchRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: string | number,
    relName: Rel,
    input: PatchRelationshipData,
    meta?: Record<string, unknown>
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>>;
  patchRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: string | number,
    relName: Rel,
    input: PatchRelationshipData,
    meta: Record<string, unknown>
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>>
  {
    return this[ORM_SERVICE_PROPS].patchRelationship(id, relName, input);
  }
}
