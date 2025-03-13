import { RelationKeys } from '@klerick/json-api-nestjs-shared';
import { Observable } from 'rxjs';

import { ReturnIfArray } from './utils';

export interface AtomicRunGeneral<T extends unknown[]> {
  run(): Observable<T>;
}

export interface AtomicRunPromise<T extends unknown[]> {
  run(): Promise<T>;
}

export interface AtomicMainOperations<T extends unknown[]> {
  postOne<Entity extends object>(
    entity: Entity
  ): AtomicOperations<[...T, Entity]>;
  patchOne<Entity extends object>(
    entity: Entity
  ): AtomicOperations<[...T, Entity]>;

  deleteOne<Entity extends object>(entity: Entity): AtomicOperations<[...T]>;
  deleteOne<Entity extends object>(
    entity: Entity,
    skipEmpty: true
  ): AtomicOperations<[...T]>;
  deleteOne<Entity extends object>(
    entity: Entity,
    skipEmpty: false
  ): AtomicOperations<[...T, 'EMPTY']>;

  patchRelationships<Entity extends object, Rel extends RelationKeys<Entity>>(
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<[...T, ReturnIfArray<Entity[Rel], string>]>;
  postRelationships<Entity extends object, Rel extends RelationKeys<Entity>>(
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<[...T, ReturnIfArray<Entity[Rel], string>]>;
  deleteRelationships<Entity extends object, Rel extends RelationKeys<Entity>>(
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<[...T]>;
}

export interface AtomicMainOperationsPromise<T extends unknown[]> {
  postOne<Entity extends object>(
    entity: Entity
  ): AtomicOperationsPromise<[...T, Entity]>;
  patchOne<Entity extends object>(
    entity: Entity
  ): AtomicOperationsPromise<[...T, Entity]>;
  deleteOne<Entity extends object>(
    entity: Entity
  ): AtomicOperationsPromise<[...T]>;
  patchRelationships<Entity extends object, Rel extends RelationKeys<Entity>>(
    entity: Entity,
    relationType: Rel
  ): AtomicOperationsPromise<[...T, ReturnIfArray<Entity[Rel], string>]>;
  postRelationships<Entity extends object, Rel extends RelationKeys<Entity>>(
    entity: Entity,
    relationType: Rel
  ): AtomicOperationsPromise<[...T, ReturnIfArray<Entity[Rel], string>]>;
  deleteRelationships<Entity extends object, Rel extends RelationKeys<Entity>>(
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
