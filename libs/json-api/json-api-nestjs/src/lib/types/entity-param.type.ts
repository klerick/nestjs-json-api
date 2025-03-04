import { Union, Object } from 'ts-toolbelt';
import {
  PropertyKeys,
  RelationKeys,
  IsIterator,
  Constructor,
} from '@klerick/json-api-nestjs-shared';
import {
  CastIteratorType,
  UnionToTuple,
  IsArray,
  CastArrayType,
} from './utils-type';

export enum TypeField {
  array = 'array',
  date = 'date',
  number = 'number',
  boolean = 'boolean',
  string = 'string',
  object = 'object',
  null = 'null',
}
export type TypeForId = Extract<TypeField, TypeField.number | TypeField.string>;

type TypeProps<T> = T extends Date
  ? TypeField.date
  : T extends any[]
  ? TypeField.array
  : T extends object
  ? TypeField.object
  : T extends boolean
  ? TypeField.boolean
  : T extends number
  ? TypeField.number
  : T extends string
  ? TypeField.string
  : TypeField.object;

export type PropertyWithType<E extends object, IdKey extends string = 'id'> = {
  [K in PropertyKeys<E, IdKey>]: Exclude<E[K], null> extends never
    ? TypeField.null
    : TypeProps<Exclude<E[K], null>>;
};

export type ArrayProperty<E extends object, IdKey extends string = 'id'> = {
  [K in PropertyKeys<E, IdKey>]: Exclude<E[K], null> extends never
    ? never
    : IsArray<Exclude<E[K], null>> extends 1
    ? K
    : never;
}[PropertyKeys<E, IdKey>];

export type ArrayPropertyType<E extends object, IdKey extends string = 'id'> = {
  [K in ArrayProperty<E, IdKey>]: TypeProps<CastArrayType<Exclude<E[K], null>>>;
};

export type NullableProperty<
  E extends object,
  IdKey extends string = 'id'
> = Union.Intersect<Object.NullableKeys<E>, PropertyKeys<E, IdKey>>;

export type RelationProperty<E extends object, IdKey extends string = 'id'> = {
  [K in RelationKeys<E, IdKey>]: {
    entityClass: Constructor<CastIteratorType<E[K]>>;
    nullable: IsIterator<E[K]> extends 1
      ? false
      : [Extract<E[K], null>] extends [never]
      ? false
      : true;
    isArray: IsIterator<E[K]> extends 1 ? true : false;
  };
};

type PrimaryType<
  E extends object,
  IdKey extends string = 'id'
> = IdKey extends keyof E
  ? TypeProps<E[IdKey]> extends TypeField
    ? TypeProps<E[IdKey]>
    : TypeField.string
  : TypeField.string;

export type EntityParam<E extends object, IdKey extends string = 'id'> = {
  props: UnionToTuple<PropertyKeys<E, IdKey>>;
  propsType: PropertyWithType<E, IdKey>;
  propsArrayType: ArrayPropertyType<E, IdKey>;
  propsNullable: UnionToTuple<NullableProperty<E, IdKey>>;
  primaryColumnName: IdKey;
  primaryColumnType: PrimaryType<E, IdKey>;
  typeName: string;
  className: string;
  relations: UnionToTuple<RelationKeys<E, IdKey>>;
  relationProperty: RelationProperty<E>;
};

type RelationType<
  E extends object,
  IdKey extends string,
  K extends keyof EntityParam<E, IdKey>['relationProperty']
> = EntityParam<
  E,
  IdKey
>['relationProperty'][K]['entityClass'] extends Constructor<infer T>
  ? Exclude<T, null>
  : never;

export type EntityRelationProps<
  E extends object,
  IdKey extends string = 'id'
> = {
  [K in keyof EntityParam<E, IdKey>['relationProperty']]: UnionToTuple<
    PropertyKeys<RelationType<E, IdKey, K>>
  >;
};
