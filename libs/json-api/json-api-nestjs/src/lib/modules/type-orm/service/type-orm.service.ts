import {
  ResourceObject,
  EntityRelation,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';
import { Inject } from '@nestjs/common';
import { Repository } from 'typeorm';

import { OrmService } from '../../mixin/types';
import {
  PatchData,
  PatchRelationshipData,
  PostData,
  PostRelationshipData,
  Query,
  QueryOne,
} from '../../mixin/zod';
import { ConfigParam, ObjectLiteral } from '../../../types';

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
import { TransformDataService } from './transform-data.service';
import {
  CONTROL_OPTIONS_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
} from '../../../constants';
import { TypeOrmParam } from '../type';

export class TypeOrmService<E extends ObjectLiteral> implements OrmService<E> {
  @Inject(TypeormUtilsService)
  public typeormUtilsService!: TypeormUtilsService<E>;
  @Inject(TransformDataService)
  public transformDataService!: TransformDataService<E>;
  @Inject(CONTROL_OPTIONS_TOKEN) public config!: ConfigParam & TypeOrmParam;
  @Inject(CURRENT_ENTITY_REPOSITORY) public repository!: Repository<E>;

  getAll(query: Query<E>): Promise<ResourceObject<E, 'array'>> {
    return getAll.call<
      TypeOrmService<E>,
      Parameters<typeof getAll<E>>,
      ReturnType<typeof getAll<E>>
    >(this, query);
  }

  deleteOne(id: number | string): Promise<void> {
    return deleteOne.call<
      TypeOrmService<E>,
      Parameters<typeof deleteOne<E>>,
      ReturnType<typeof deleteOne<E>>
    >(this, id);
  }

  deleteRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<void> {
    return deleteRelationship.call<
      TypeOrmService<E>,
      Parameters<typeof deleteRelationship<E, Rel>>,
      ReturnType<typeof deleteRelationship<E, Rel>>
    >(this, id, rel, input);
  }

  getOne(id: number | string, query: QueryOne<E>): Promise<ResourceObject<E>> {
    return getOne.call<
      TypeOrmService<E>,
      Parameters<typeof getOne<E>>,
      ReturnType<typeof getOne<E>>
    >(this, id, query);
  }

  getRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return getRelationship.call<
      TypeOrmService<E>,
      Parameters<typeof getRelationship<E, Rel>>,
      ReturnType<typeof getRelationship<E, Rel>>
    >(this, id, rel);
  }

  patchOne(
    id: number | string,
    inputData: PatchData<E>
  ): Promise<ResourceObject<E>> {
    return patchOne.call<
      TypeOrmService<E>,
      Parameters<typeof patchOne<E>>,
      ReturnType<typeof patchOne<E>>
    >(this, id, inputData);
  }

  patchRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return patchRelationship.call<
      TypeOrmService<E>,
      Parameters<typeof patchRelationship<E, Rel>>,
      ReturnType<typeof patchRelationship<E, Rel>>
    >(this, id, rel, input);
  }

  postOne(inputData: PostData<E>): Promise<ResourceObject<E>> {
    return postOne.call<
      TypeOrmService<E>,
      Parameters<typeof postOne<E>>,
      ReturnType<typeof postOne<E>>
    >(this, inputData);
  }

  postRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return postRelationship.call<
      TypeOrmService<E>,
      Parameters<typeof postRelationship<E, Rel>>,
      ReturnType<typeof postRelationship<E, Rel>>
    >(this, id, rel, input);
  }
}
