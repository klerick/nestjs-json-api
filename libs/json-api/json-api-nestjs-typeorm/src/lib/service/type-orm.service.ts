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
} from '@klerick/json-api-nestjs';
import {
  ResourceObject,
  RelationKeys,
  ResourceObjectRelationships,
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

  getAll(
    query: Query<E, IdKey>
  ): Promise<ResourceObject<E, 'array', null, IdKey>> {
    return getAll.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof getAll<E, IdKey>>,
      ReturnType<typeof getAll<E, IdKey>>
    >(this, query);
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

  getOne(
    id: number | string,
    query: QueryOne<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>> {
    return getOne.call<
      TypeOrmService<E, IdKey>,
      Parameters<typeof getOne<E, IdKey>>,
      ReturnType<typeof getOne<E, IdKey>>
    >(this, id, query);
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
}
