import {
  EntityRelation,
  ResourceObject,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';

import { ObjectLiteral } from '../../../types';
import { OrmService } from '../../mixin/types';
import {
  PatchData,
  PatchRelationshipData,
  PostData,
  PostRelationshipData,
  Query,
  QueryOne,
} from '../../mixin/zod';

export class MicroOrmService<E extends ObjectLiteral> implements OrmService<E> {
  postOne(inputData: PostData<E>): Promise<ResourceObject<E>> {
    return {} as any;
  }
  patchOne(
    id: number | string,
    inputData: PatchData<E>
  ): Promise<ResourceObject<E>> {
    return {} as any;
  }

  getOne(id: number | string, query: QueryOne<E>): Promise<ResourceObject<E>> {
    return {} as any;
  }

  getAll(query: Query<E>): Promise<ResourceObject<E, 'array'>> {
    return {} as any;
  }

  async deleteOne(id: number | string): Promise<void> {}

  postRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return {} as any;
  }

  getRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return {} as any;
  }

  patchRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return {} as any;
  }
  async deleteRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<void> {}
}
