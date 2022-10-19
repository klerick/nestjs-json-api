import {
  SortRules,
  Includes,
  Pagination,
  Fields,
  QueryField,
  EntityProps,
  Operands,
  OperandsRelation,
  EntityRelation,
  ElementType,
  Meta,
} from 'json-api-nestjs';

import { ObjectLiteral, ObjectType } from 'typeorm/browser';
import { Observable } from 'rxjs';
import { EntityArray } from '../utils';

export declare type Filter<T> = {
  target?: Partial<
    {
      [P in EntityProps<T>]?: Operands;
    } & {
      [P in EntityRelation<T>]?: OperandsRelation;
    }
  >;
  relation?: Partial<{
    [P in EntityRelation<T>]?: {
      [key in EntityProps<ElementType<T[P]>>]?: Operands;
    };
  }>;
};

export interface QueryParams<T> {
  [QueryField.filter]?: Filter<T>;
  [QueryField.include]?: Includes<T>;
  [QueryField.sort]?: Partial<SortRules<T>>;
  [QueryField.page]?: Pagination;
  [QueryField.fields]?: Partial<Fields<T>>;
}

export type QueryParamsForOneItem<T> = Pick<
  QueryParams<T>,
  QueryField.include | QueryField.filter | QueryField.fields
>;

export interface JsonApiSdkServicePromise {
  getAll<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    params: QueryParams<Entity>,
    forAllPage: boolean
  ): Promise<EntityArray<Entity>>;

  getOne<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    id: string | number
  ): Promise<Entity>;
  getOne<Entity extends ObjectLiteral, MetaData extends Meta>(
    resource: ObjectType<Entity>,
    id: string | number,
    returnMeta: boolean
  ): Promise<{ entity: Entity; meta: MetaData }>;
  getOne<Entity extends ObjectLiteral>(
    entity: ObjectType<Entity>,
    id: string | number,
    params: QueryParamsForOneItem<Entity>
  ): Promise<Entity>;
  getOne<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    id: string | number,
    returnMeta: boolean
  ): Promise<{ entity: Entity; meta: Meta }>;
  getOne<Entity extends ObjectLiteral, MetaData extends Meta>(
    entity: ObjectType<Entity>,
    id: string | number,
    params: QueryParamsForOneItem<Entity>,
    returnMeta: boolean
  ): Promise<{ entity: Entity; meta: MetaData }>;
  getOne<Entity extends ObjectLiteral>(
    entity: ObjectType<Entity>,
    id: string | number,
    params: QueryParamsForOneItem<Entity>,
    returnMeta: boolean
  ): Promise<{ entity: Entity; meta: Meta }>;

  postOne<Entity extends ObjectLiteral>(entity: Entity): Promise<Entity>;
  postOne<Entity extends ObjectLiteral>(
    entity: Entity,
    returnMeta: boolean
  ): Promise<{ entity: Entity; meta: Meta }>;
  postOne<Entity extends ObjectLiteral, MetaData extends Meta>(
    entity: Entity,
    returnMeta: boolean
  ): Promise<{ entity: Entity; meta: MetaData }>;
  patchOne<Entity extends ObjectLiteral>(entity: Entity): Promise<Entity>;
  patchOne<Entity extends ObjectLiteral, MetaData extends Meta>(
    entity: Entity,
    returnMeta: boolean
  ): Promise<{ entity: Entity; meta: MetaData }>;
  patchOne<Entity extends ObjectLiteral>(
    entity: Entity,
    returnMeta: boolean
  ): Promise<{ entity: Entity; meta: any }>;

  deleteOne<Entity extends ObjectLiteral>(entity: Entity): Promise<void>;

  getRelationships<Entity extends ObjectLiteral>(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Promise<string[] | string>;

  patchRelationships<Entity extends ObjectLiteral>(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Promise<string[] | string>;

  postRelationships<Entity extends ObjectLiteral>(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Promise<string[] | string>;

  deleteRelationships<Entity extends ObjectLiteral>(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Promise<void>;
}
