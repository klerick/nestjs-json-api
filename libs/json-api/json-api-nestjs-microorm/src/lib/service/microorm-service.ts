import { Inject } from '@nestjs/common';
import {
  QueryField,
  ResourceObject,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';
import {
  JsonApiTransformerService,
  OrmService,
  PatchData,
  PatchRelationshipData,
  PostData,
  PostRelationshipData,
  Query,
  QueryOne,
} from '@klerick/json-api-nestjs';

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
import { RelationKeys } from '@klerick/json-api-nestjs-shared';

export class MicroOrmService<E extends object, IdKey extends string = 'id'>
  implements OrmService<E, IdKey>
{
  @Inject(MicroOrmUtilService) microOrmUtilService!: MicroOrmUtilService<
    E,
    IdKey
  >;
  @Inject(JsonApiTransformerService)
  jsonApiTransformerService!: JsonApiTransformerService<E, IdKey>;

  async getAll(
    query: Query<E, IdKey>
  ): Promise<ResourceObject<E, 'array', null, IdKey>> {
    const { page } = query;
    const { totalItems, items } = await getAll.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof getAll<E, IdKey>>,
      ReturnType<typeof getAll<E, IdKey>>
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
    query: QueryOne<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>> {
    const result = await getOne.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof getOne<E, IdKey>>,
      ReturnType<typeof getOne<E, IdKey>>
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
      MicroOrmService<E, IdKey>,
      Parameters<typeof deleteOne<E, IdKey>>,
      ReturnType<typeof deleteOne<E, IdKey>>
    >(this, id);
  }

  async postOne(
    inputData: PostData<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>> {
    const result = await postOne.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof postOne<E, IdKey>>,
      ReturnType<typeof postOne<E, IdKey>>
    >(this, inputData);

    const { relationships } = inputData;
    const fakeQuery: Query<E, IdKey> = {
      [QueryField.fields]: null,
      [QueryField.include]: Object.keys(relationships || {}),
    } as any;

    const resultForResponse = await getOne.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof getOne<E, IdKey>>,
      ReturnType<typeof getOne<E, IdKey>>
    >(
      this,
      result[this.microOrmUtilService.currentPrimaryColumn] as any,
      fakeQuery
    );

    const { data, included } = this.jsonApiTransformerService.transformData(
      resultForResponse,
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
    inputData: PatchData<E, IdKey>
  ): Promise<ResourceObject<E, 'object', null, IdKey>> {
    await patchOne.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof patchOne<E, IdKey>>,
      ReturnType<typeof patchOne<E, IdKey>>
    >(this, id, inputData);

    const { relationships } = inputData;
    const fakeQuery: Query<E, IdKey> = {
      [QueryField.fields]: null,
      [QueryField.include]: Object.keys(relationships || {}),
    } as any;

    const resultForResponse = await getOne.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof getOne<E, IdKey>>,
      ReturnType<typeof getOne<E, IdKey>>
    >(this, id, fakeQuery);

    const { data, included } = this.jsonApiTransformerService.transformData(
      resultForResponse,
      fakeQuery
    );

    return {
      meta: {},
      data,
      ...(included ? { included } : {}),
    };
  }

  async getRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
    const result = await getRelationship.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof getRelationship<E, IdKey, Rel>>,
      ReturnType<typeof getRelationship<E, IdKey, Rel>>
    >(this, id, rel);

    return {
      meta: {},
      data: this.jsonApiTransformerService.transformRel(result, rel),
    };
  }

  async deleteRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<void> {
    await deleteRelationship.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof deleteRelationship<E, IdKey, Rel>>,
      ReturnType<typeof deleteRelationship<E, IdKey, Rel>>
    >(this, id, rel, input);
  }

  async postRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel,
    input: PostRelationshipData
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
    const result = await postRelationship.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof postRelationship<E, IdKey, Rel>>,
      ReturnType<typeof postRelationship<E, IdKey, Rel>>
    >(this, id, rel, input);

    return {
      meta: {},
      data: this.jsonApiTransformerService.transformRel(result, rel),
    };
  }

  async patchRelationship<Rel extends RelationKeys<E, IdKey>>(
    id: number | string,
    rel: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
    const result = await patchRelationship.call<
      MicroOrmService<E, IdKey>,
      Parameters<typeof patchRelationship<E, IdKey, Rel>>,
      ReturnType<typeof patchRelationship<E, IdKey, Rel>>
    >(this, id, rel, input);

    return {
      meta: {},
      data: this.jsonApiTransformerService.transformRel(result, rel),
    };
  }
}
