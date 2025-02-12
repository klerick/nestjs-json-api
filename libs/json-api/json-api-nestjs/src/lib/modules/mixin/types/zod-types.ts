import { Type } from '@nestjs/common';
import { z } from 'zod';

import {
  EntityProps,
  EntityRelation,
  UnionToTuple,
  CastProps,
  TypeOfArray,
  EntityPropsArray,
  IsArray,
} from './utils';
import {
  EntityTarget,
  ObjectLiteral as Entity,
  ObjectLiteral,
} from '../../../types';
import { Collection } from '@mikro-orm/core';

export enum PropsNameResultField {
  field = 'field',
  relations = 'relations',
}

export type ResultGetField<E extends ObjectLiteral> = {
  [PropsNameResultField.field]: TupleOfEntityProps<E>;
  [PropsNameResultField.relations]: TupleOfEntityRelation<E>;
};

export type TupleOfEntityProps<
  E,
  Props = UnionToTuple<EntityProps<E>>
> = Props extends readonly [string, ...string[]] ? Props : never;
export type TupleOfEntityRelation<
  E,
  Props = UnionToTuple<EntityRelation<E>>
> = Props extends readonly [string, ...string[]] ? Props : never;

export type RelationTree<E extends Entity> = {
  [K in keyof RelationType<E>]: TypeOfArray<E[K]> extends Entity
    ? ResultGetField<TypeOfArray<E[K]>>['field']
    : never;
};

export type RelationType<E extends Entity> = {
  [K in EntityRelation<E>]: Type<TypeOfArray<CastProps<E, K>>>;
};

export type ZodInfer<T extends (...args: any) => any> = z.infer<ReturnType<T>>;

export type GetFieldForEntity<E extends ObjectLiteral> = (
  entity: EntityTarget<E>
) => ResultGetField<E>;

export type ZodParams<
  E extends Entity,
  P extends EntityProps<E>,
  I = string
> = {
  entityFieldsStructure: ResultGetField<E>;
  entityRelationStructure: RelationTree<E>;
  propsArray: ArrayPropsForEntity<E>;
  propsType: AllFieldWithType<E>;
  typeId: TypeForId;
  typeName: I;
  fieldWithType: FieldWithType<E>;
  propsDb: PropsForField<E>;
  primaryColumn: P;
  relationArrayProps: RelationPropsArray<E>;
  relationPopsName: RelationPropsTypeName<E>;
  primaryColumnType: RelationPrimaryColumnType<E>;
};

export type PropsArray<E> = { [K in EntityPropsArray<E>]: true };

export type ArrayPropsForEntity<E extends Entity> = {
  target: PropsArray<E>;
} & {
  [K in ResultGetField<E>['relations'][number]]: PropsArray<
    TypeOfArray<CastProps<E, K>>
  >;
};

export enum TypeField {
  array = 'array',
  date = 'date',
  number = 'number',
  boolean = 'boolean',
  string = 'string',
  object = 'object',
}
export type TypeForId = Extract<TypeField, TypeField.number | TypeField.string>;

export type FieldWithType<E extends Entity> = {
  [K in EntityProps<E>]: IsArray<E[K]> extends true
    ? TypeField.array
    : E[K] extends Date
    ? TypeField.date
    : E[K] extends number
    ? TypeField.number
    : E[K] extends boolean
    ? TypeField.boolean
    : E[K] extends object
    ? TypeField.object
    : TypeField.string;
};

export type AllFieldWithType<E extends Entity> = FieldWithType<E> & {
  [K in EntityRelation<E>]: E[K] extends (infer U extends Entity)[]
    ? FieldWithType<U>
    : E[K] extends Entity
    ? FieldWithType<E[K]>
    : never;
};

export type PropsForField<E extends Entity> = {
  [K in EntityProps<E>]: PropsFieldItem;
} & {
  [K in EntityRelation<E>]: PropsFieldItem;
};

export type ColumnType<T = string> =
  | T
  | typeof Number
  | typeof Date
  | typeof Boolean;

export type PropsFieldItem = {
  type: ColumnType;
  isArray: boolean;
  isNullable: boolean;
};

export type RelationPropsArray<E extends Entity> = {
  [K in EntityRelation<E>]: E[K] extends unknown[]
    ? true
    : E[K] extends Collection<TypeOfArray<E[K]>>
    ? true
    : false;
};

export type RelationPropsTypeName<E extends Entity> = {
  [K in EntityRelation<E>]: string;
};

export type RelationPrimaryColumnType<E extends Entity> = {
  [K in EntityRelation<E>]: TypeForId;
};

export type FilterNullableProps<
  T,
  Props extends readonly (keyof T)[]
> = Props extends [infer Head, ...infer Tail]
  ? Head extends keyof T
    ? null extends T[Head]
      ? [Head, ...FilterNullableProps<T, Tail extends (keyof T)[] ? Tail : []>]
      : FilterNullableProps<T, Tail extends (keyof T)[] ? Tail : []>
    : FilterNullableProps<T, Tail extends (keyof T)[] ? Tail : []>
  : [];

export type RelationProperty<E extends Entity> = {
  [K in TupleOfEntityRelation<E>[number]]: {
    entityClass: TypeOfArray<CastProps<E, K>>;
    nullable: [Extract<E[K], null>] extends [never] ? false : true;
    isArray: E[K] extends unknown[] ? true : false;
  };
};

export type ZodEntityProps<E extends Entity, I = string> = {
  props: TupleOfEntityProps<E>;
  propsType: FieldWithType<E>;
  propsNullable: FilterNullableProps<E, TupleOfEntityProps<E>>;
  primaryColumnName: I;
  primaryColumnType: TypeForId;
  typeName: string;
  className: string;
  relations: TupleOfEntityRelation<E>;
  relationProperty: RelationProperty<E>;
};
