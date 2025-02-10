import {
  EntityRelation,
  QueryField,
  ResourceObject,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';
import { Inject } from '@nestjs/common';

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

import {
  getAll,
  getOne,
  deleteOne,
  postOne,
  patchOne,
  getRelationship,
  deleteRelationship,
  patchRelationship,
  postRelationship,
} from '../orm-methods';
import { MicroOrmUtilService } from './micro-orm-util.service';
import { JsonApiTransformerService } from '../../mixin/service/json-api-transformer.service';

export class MicroOrmService<E extends ObjectLiteral> implements OrmService<E> {
  @Inject(MicroOrmUtilService) microOrmUtilService!: MicroOrmUtilService<E>;
  @Inject(JsonApiTransformerService)
  jsonApiTransformerService!: JsonApiTransformerService<E>;

  async getAll(query: Query<E>): Promise<ResourceObject<E, 'array'>> {
    const { page } = query;
    const { totalItems, items } = await getAll.call<
      MicroOrmService<E>,
      Parameters<typeof getAll<E>>,
      ReturnType<typeof getAll<E>>
    >(this, query);

    const { data, included } = this.jsonApiTransformerService.transformData(
      items,
      query
    );

    const meta = {
      totalItems: totalItems,
      pageNumber: page.number,
      pageSize: page.size,
    };

    return {
      meta,
      data,
      ...(included ? { included } : {}),
    };
  }

  async getOne(
    id: number | string,
    query: QueryOne<E>
  ): Promise<ResourceObject<E>> {
    const result = await getOne.call<
      MicroOrmService<E>,
      Parameters<typeof getOne<E>>,
      ReturnType<typeof getOne<E>>
    >(this, id, query);
    const { data, included } = this.jsonApiTransformerService.transformData(
      result,
      query
    );
    return {
      meta: {},
      data,
      ...(included ? { included } : {}),
    };
  }

  async deleteOne(id: number | string): Promise<void> {
    await deleteOne.call<
      MicroOrmService<E>,
      Parameters<typeof deleteOne<E>>,
      ReturnType<typeof deleteOne<E>>
    >(this, id);
  }

  async postOne(inputData: PostData<E>): Promise<ResourceObject<E>> {
    const result = await postOne.call<
      MicroOrmService<E>,
      Parameters<typeof postOne<E>>,
      ReturnType<typeof postOne<E>>
    >(this, inputData);

    const { relationships } = inputData;
    const fakeQuery: Query<E> = {
      [QueryField.fields]: null,
      [QueryField.include]: Object.keys(relationships || {}),
    } as any;

    const { data, included } = this.jsonApiTransformerService.transformData(
      result,
      fakeQuery
    );

    return {
      meta: {},
      data,
      ...(included ? { included } : {}),
    };
  }
  async patchOne(
    id: number | string,
    inputData: PatchData<E>
  ): Promise<ResourceObject<E>> {
    const result = await patchOne.call<
      MicroOrmService<E>,
      Parameters<typeof patchOne<E>>,
      ReturnType<typeof patchOne<E>>
    >(this, id, inputData);

    const { relationships } = inputData;
    const fakeQuery: Query<E> = {
      [QueryField.fields]: null,
      [QueryField.include]: Object.keys(relationships || {}),
    } as any;

    const { data, included } = this.jsonApiTransformerService.transformData(
      result,
      fakeQuery
    );

    return {
      meta: {},
      data,
      ...(included ? { included } : {}),
    };
  }

  async getRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    const result = await getRelationship.call<
      MicroOrmService<E>,
      Parameters<typeof getRelationship<E, Rel>>,
      ReturnType<typeof getRelationship<E, Rel>>
    >(this, id, rel);

    return {
      meta: {},
      data: this.jsonApiTransformerService.transformRel(result, rel),
    };
  }

  async deleteRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<void> {
    await deleteRelationship.call<
      MicroOrmService<E>,
      Parameters<typeof deleteRelationship<E, Rel>>,
      ReturnType<typeof deleteRelationship<E, Rel>>
    >(this, id, rel, input);
  }

  async postRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    const result = await postRelationship.call<
      MicroOrmService<E>,
      Parameters<typeof postRelationship<E, Rel>>,
      ReturnType<typeof postRelationship<E, Rel>>
    >(this, id, rel, input);

    return {
      meta: {},
      data: this.jsonApiTransformerService.transformRel(result, rel),
    };
  }

  async patchRelationship<Rel extends EntityRelation<E>>(
    id: number | string,
    rel: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    const result = await patchRelationship.call<
      MicroOrmService<E>,
      Parameters<typeof patchRelationship<E, Rel>>,
      ReturnType<typeof patchRelationship<E, Rel>>
    >(this, id, rel, input);

    return {
      meta: {},
      data: this.jsonApiTransformerService.transformRel(result, rel),
    };
  }
}
