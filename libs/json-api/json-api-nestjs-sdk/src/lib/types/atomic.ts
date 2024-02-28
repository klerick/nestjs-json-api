import { Entity as EntityObject, EntityRelation } from './entity';
import { ReturnIfArray } from './utils';
import { Observable } from 'rxjs';

export interface AtomicRunGeneral<T extends unknown[]> {
  run(): Observable<T>;
}

export interface AtomicRunPromise<T extends unknown[]> {
  run(): Promise<T>;
}

export interface AtomicMainOperations<T extends unknown[]> {
  postOne<Entity extends EntityObject>(
    entity: Entity
  ): AtomicOperations<[...T, Entity]>;
  patchOne<Entity extends EntityObject>(
    entity: Entity
  ): AtomicOperations<[...T, Entity]>;
  deleteOne<Entity extends EntityObject>(
    entity: Entity
  ): AtomicOperations<[...T]>;
  patchRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<[...T, ReturnIfArray<Entity[Rel], string>]>;
  postRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<[...T, ReturnIfArray<Entity[Rel], string>]>;
  deleteRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<[...T]>;
}

export interface AtomicMainOperationsPromise<T extends unknown[]> {
  postOne<Entity extends EntityObject>(
    entity: Entity
  ): AtomicOperationsPromise<[...T, Entity]>;
  patchOne<Entity extends EntityObject>(
    entity: Entity
  ): AtomicOperationsPromise<[...T, Entity]>;
  deleteOne<Entity extends EntityObject>(
    entity: Entity
  ): AtomicOperationsPromise<[...T]>;
  patchRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): AtomicOperationsPromise<[...T, ReturnIfArray<Entity[Rel], string>]>;
  postRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): AtomicOperationsPromise<[...T, ReturnIfArray<Entity[Rel], string>]>;
  deleteRelationships<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): AtomicOperationsPromise<[...T]>;
}

export interface AtomicOperations<T extends unknown[]>
  extends AtomicMainOperations<T>,
    AtomicRunGeneral<T> {}
export interface AtomicOperationsPromise<T extends unknown[]>
  extends AtomicMainOperationsPromise<T>,
    AtomicRunPromise<T> {}

export type AtomicFactory = () => AtomicOperations<[]>;
export type AtomicFactoryPromise = () => AtomicOperationsPromise<[]>;
