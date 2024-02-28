import { Entity as EntityObject, EntityRelation, EntityType } from './entity';
import { QueryParams, QueryParamsForOneItem } from './query-params';
import { EntityArray } from '../utils';
import { ReturnIfArray } from './utils';

export interface PromiseJsonApiSdkService {
  getList<Entity>(
    entity: EntityType<Entity>,
    params?: QueryParams<Entity>
  ): Promise<EntityArray<Entity>>;

  getAll<Entity>(
    entity: EntityType<Entity>,
    params?: QueryParams<Entity>
  ): Promise<EntityArray<Entity>>;

  getOne<Entity>(
    entity: EntityType<Entity>,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Promise<Entity>;

  postOne<Entity extends EntityObject>(entity: Entity): Promise<Entity>;
  patchOne<Entity extends EntityObject>(entity: Entity): Promise<Entity>;

  deleteOne<Entity extends EntityObject>(entity: Entity): Promise<void>;

  getRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): Promise<ReturnIfArray<Entity[Rel], string>>;

  patchRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): Promise<ReturnIfArray<Entity[Rel], string>>;

  postRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): Promise<ReturnIfArray<Entity[Rel], string>>;

  deleteRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): Promise<void>;
}
