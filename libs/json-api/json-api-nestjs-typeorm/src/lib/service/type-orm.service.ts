import { Inject } from '@nestjs/common';
import {
  OrmService,
  PatchData,
  PatchRelationshipData,
  PostData,
  PostRelationshipData,
  Query,
  QueryOne,
  EntityControllerParam,
  JsonApiTransformerService,
  CONTROLLER_OPTIONS_TOKEN,
  Relationships,
} from '@klerick/json-api-nestjs';
import {
  ResourceObject,
  RelationKeys,
  ResourceObjectRelationships,
  ObjectTyped,
} from '@klerick/json-api-nestjs-shared';

import { Repository } from 'typeorm';

import {
  getAll,
  getOne,
  deleteOne,
  postOne,
  patchOne,
  getRelationship,
  postRelationship,
  deleteRelationship,
  patchRelationship,
} from '../orm-methods';

import { TypeormUtilsService } from './typeorm-utils.service';
import { CURRENT_ENTITY_REPOSITORY } from '../constants';
import { TypeOrmParam } from '../type';

export class TypeOrmService<E extends object, IdKey extends string = 'id'>
  implements OrmService<E, IdKey>
{
  @Inject(TypeormUtilsService)
  public typeormUtilsService!: TypeormUtilsService<E, IdKey>;
  @Inject(JsonApiTransformerService)
  public transformDataService!: JsonApiTransformerService<E, IdKey>;
  @Inject(CONTROLLER_OPTIONS_TOKEN)
  public config!: EntityControllerParam<TypeOrmParam>;
  @Inject(CURRENT_ENTITY_REPOSITORY) public repository!: Repository<E>;

  async getAll(
    query: Query<E, IdKey>
  ): Promise<ResourceObject<E, 'array', null, IdKey>>;
  async getAll(
    query: Query<E, IdKey>,
    transformData?: boolean,
    additionalQueryParams?: Record<string, unknown>
  ): Promise<ResourceObject<E, 'array', null, IdKey>>;
  async getAll(
    query: Query<E, IdKey>,
    transformData = true,
    additionalQueryParams?: Record<string, unknown>
  ): Promise<
    ResourceObject<E, 'array', null, IdKey> | { totalItems: number; items: E[] }
  > {
    return getAll.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof getAll<E, IdKey>>,
      ReturnType<typeof getAll<E, IdKey>>
    >(this, query, transformData, additionalQueryParams);
  }

  deleteOne(id: number | string): Promise<void> {
    return deleteOne.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof deleteOne<E, IdKey>>,
      ReturnType<typeof deleteOne<E, IdKey>>
    >(this, id);
  }

  deleteRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<void> {
    return deleteRelationship.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof deleteRelationship<E, IdKey, Rel>>,
      ReturnType<typeof deleteRelationship<E, IdKey, Rel>>
    >(this, id, rel, input);
  }

  async getOne(
    id: number | string,
    query: QueryOne<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>>;
  async getOne(
    id: number | string,
    query: QueryOne<E, IdKey>,
    transformData?: boolean,
    additionalQueryParams?: Record<string, unknown>
  ): Promise<ResourceObject<E, 'object', null, IdKey> | E>;
  async getOne(
    id: number | string,
    query: QueryOne<E, IdKey>,
    transformData = true,
    additionalQueryParams?: Record<string, unknown>
  ): Promise<ResourceObject<E, 'object', null, IdKey> | E> {
    return getOne.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof getOne<E, IdKey>>,
      ReturnType<typeof getOne<E, IdKey>>
    >(this, id, query, transformData, additionalQueryParams);
  }

  getRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
    return getRelationship.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof getRelationship<E, IdKey, Rel>>,
      ReturnType<typeof getRelationship<E, IdKey, Rel>>
    >(this, id, rel);
  }

  patchOne(
    id: number | string,
    inputData: PatchData<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>> {
    return patchOne.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof patchOne<E, IdKey>>,
      ReturnType<typeof patchOne<E, IdKey>>
    >(this, id, inputData);
  }

  patchRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
    return patchRelationship.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof patchRelationship<E, IdKey, Rel>>,
      ReturnType<typeof patchRelationship<E, IdKey, Rel>>
    >(this, id, rel, input);
  }

  postOne(
    inputData: PostData<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>> {
    return postOne.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof postOne<E, IdKey>>,
      ReturnType<typeof postOne<E, IdKey>>
    >(this, inputData);
  }

  postRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
    return postRelationship.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof postRelationship<E, IdKey, Rel>>,
      ReturnType<typeof postRelationship<E, IdKey, Rel>>
    >(this, id, rel, input);
  }

  async loadRelations(
    relationships: NonNullable<Relationships<E, IdKey>>
  ): Promise<{
    [K in RelationKeys<E>]: E[K];
  }> {
    const result = {} as { [K in RelationKeys<E> ]: E[K]; };

    for await (const item of this.typeormUtilsService.asyncIterateFindRelationships(
      relationships as any
    )) {
      const itemProps = ObjectTyped.entries(item).at(0);
      if (!itemProps) continue;
      const [nameProps, data] = itemProps;
      Reflect.set(result, nameProps, data);
    }

    return result;
  }
}
