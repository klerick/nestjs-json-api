import { EntityClass, RelationKeys } from '@klerick/json-api-nestjs-shared';

import { QueryParams, QueryParamsForOneItem } from './query-params';
import { EntityArray } from '../utils';
import { ReturnIfArray } from './utils';
import { PromiseEntityChain } from './entity-chain';

/**
 * JsonApiSdkService with Promise return types
 * Methods support separate Input and Output types via generics.
 * If OutputEntity is not specified, it defaults to the same as Entity.
 */
export interface PromiseJsonApiSdkService {
  getList<Entity extends object, OutputEntity extends Entity = Entity>(
    entity: EntityClass<Entity>,
    params?: QueryParams<Entity>
  ): Promise<EntityArray<OutputEntity>>;
  getList<Entity extends object, OutputEntity extends Entity = Entity>(
    typeName: string,
    params?: QueryParams<Entity>
  ): Promise<EntityArray<OutputEntity>>;

  getAll<Entity extends object, OutputEntity extends Entity = Entity>(
    entity: EntityClass<Entity>,
    params?: QueryParams<Entity>,
    push?: boolean
  ): Promise<EntityArray<OutputEntity>>;
  getAll<Entity extends object, OutputEntity extends Entity = Entity>(
    typeName: string,
    params?: QueryParams<Entity>,
    push?: boolean
  ): Promise<EntityArray<OutputEntity>>;

  getOne<Entity extends object, OutputEntity extends Entity = Entity>(
    entity: EntityClass<Entity>,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Promise<OutputEntity>;
  getOne<Entity extends object, OutputEntity extends Entity = Entity>(
    typeName: string,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Promise<OutputEntity>;

  postOne<Entity extends object, OutputEntity extends Entity = Entity>(
    entity: Entity
  ): Promise<OutputEntity>;
  patchOne<Entity extends object, OutputEntity extends Entity = Entity>(
    entity: Entity
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
    relationType: Rel
  ): Promise<ReturnIfArray<Entity[Rel], string>>;

  postRelationships<
    Entity extends object,
    IdKey extends string = 'id',
    Rel extends RelationKeys<Entity, IdKey> = RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel
  ): Promise<ReturnIfArray<Entity[Rel], string>>;

  deleteRelationships<
    Entity extends object,
    IdKey extends string = 'id',
    Rel extends RelationKeys<Entity, IdKey> = RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel
  ): Promise<void>;

  entity<E extends object, OutputE extends E = E>(
    typeName: string,
    data: E
  ): PromiseEntityChain<E, OutputE>;
  entity<E extends object>(typeName: string, data: E, raw: true): E;
}
