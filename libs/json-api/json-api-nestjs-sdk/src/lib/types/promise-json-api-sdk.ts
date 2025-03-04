import { EntityClass, RelationKeys } from '@klerick/json-api-nestjs-shared';

import { QueryParams, QueryParamsForOneItem } from './query-params';
import { EntityArray } from '../utils';
import { ReturnIfArray } from './utils';

export interface PromiseJsonApiSdkService {
  getList<Entity extends object>(
    entity: EntityClass<Entity>,
    params?: QueryParams<Entity>
  ): Promise<EntityArray<Entity>>;

  getAll<Entity extends object>(
    entity: EntityClass<Entity>,
    params?: QueryParams<Entity>
  ): Promise<EntityArray<Entity>>;

  getOne<Entity extends object>(
    entity: EntityClass<Entity>,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Promise<Entity>;

  postOne<Entity extends object>(entity: Entity): Promise<Entity>;
  patchOne<Entity extends object>(entity: Entity): Promise<Entity>;

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
}
