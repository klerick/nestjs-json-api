import { EntityClass, RelationKeys } from '@klerick/json-api-nestjs-shared';

import { QueryParams, QueryParamsForOneItem } from './query-params';
import { EntityArray } from '../utils';
import { ReturnIfArray } from './utils';
import { PromiseEntityChain } from './entity-chain';

/**
 * JsonApiSdkService with Promise return types
 * POST/PATCH methods support separate Input and Output types via generics.
 * If OutputEntity is not specified, it defaults to the same as Entity.
 */
export interface PromiseJsonApiSdkService {
  getList<Entity extends object>(
    entity: EntityClass<Entity>,
    params?: QueryParams<Entity>
  ): Promise<EntityArray<Entity>>;
  getList<Entity extends object>(
    typeName: string,
    params?: QueryParams<Entity>
  ): Promise<EntityArray<Entity>>;

  getAll<Entity extends object>(
    entity: EntityClass<Entity>,
    params?: QueryParams<Entity>,
    push?: boolean
  ): Promise<EntityArray<Entity>>;
  getAll<Entity extends object>(
    typeName: string,
    params?: QueryParams<Entity>,
    push?: boolean
  ): Promise<EntityArray<Entity>>;

  getOne<Entity extends object>(
    entity: EntityClass<Entity>,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Promise<Entity>;
  getOne<Entity extends object>(
    typeName: string,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Promise<Entity>;

  postOne<Entity extends object, OutputEntity extends Entity = Entity>(
    entity: Entity,
    meta?: Record<string, unknown>
  ): Promise<OutputEntity>;
  patchOne<Entity extends object, OutputEntity extends Entity = Entity>(
    entity: Entity,
    meta?: Record<string, unknown>
  ): Promise<OutputEntity>;
  deleteOne<Entity extends object>(entity: Entity): Promise<void>;

  getRelationships<
    Entity extends object,
    IdKey extends string = 'id',
    Rel extends RelationKeys<Entity, IdKey> = RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel
  ): Promise<ReturnIfArray<Entity[Rel], string>>;

  patchRelationships<
    Entity extends object,
    IdKey extends string = 'id',
    Rel extends RelationKeys<Entity, IdKey> = RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel,
    meta?: Record<string, unknown>
  ): Promise<ReturnIfArray<Entity[Rel], string>>;

  postRelationships<
    Entity extends object,
    IdKey extends string = 'id',
    Rel extends RelationKeys<Entity, IdKey> = RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel,
    meta?: Record<string, unknown>
  ): Promise<ReturnIfArray<Entity[Rel], string>>;

  deleteRelationships<
    Entity extends object,
    IdKey extends string = 'id',
    Rel extends RelationKeys<Entity, IdKey> = RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel,
    meta?: Record<string, unknown>
  ): Promise<void>;

  entity<E extends object, OutputE extends E = E>(
    typeName: string,
    data: E
  ): PromiseEntityChain<E, OutputE>;
  entity<E extends object>(typeName: string, data: E, raw: true): E;
}
