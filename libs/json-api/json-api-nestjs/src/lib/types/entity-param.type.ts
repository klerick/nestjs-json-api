import { Union, Object } from 'ts-toolbelt';
import {
  AttrKeys,
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
// Extract base primitive/known type from intersection (ignores marker types like Opt, JsonApiReadOnlyField, etc.)
// Distributive over unions: ExtractBaseType<number | undefined> = number | undefined
type ExtractBaseType<T> =
  T extends Date ? Date :
  T extends boolean ? boolean :
  T extends number ? number :
  T extends string ? string :
  T extends null ? null :
  T extends undefined ? undefined :
  T extends (infer U)[] ? U[] :
  object;

// import {
//   JsonApiReadOnlyField,
//   JsonApiImmutableField,
// } from './json-api-read-only';

// // Remove marker types from value type
// type CleanMarkerTypes<T> = T extends JsonApiReadOnlyField &
//   JsonApiImmutableField
//   ? Omit<T, keyof JsonApiReadOnlyField | keyof JsonApiImmutableField>
//   : T extends JsonApiReadOnlyField
//   ? Omit<T, keyof JsonApiReadOnlyField>
//   : T extends JsonApiImmutableField
//   ? Omit<T, keyof JsonApiImmutableField>
//   : T;

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
  : T extends undefined
  ? never  // Skip undefined in union, e.g. TypeProps<number | undefined> = TypeField.number
  : TypeField.object;

export type PropertyWithType<E extends object, IdKey extends string = 'id'> = {
  [K in AttrKeys<E, IdKey>]: Exclude<E[K], null | undefined> extends never
    ? TypeField.null
    : TypeProps<ExtractBaseType<Exclude<E[K], null | undefined>>>;
};

export type ArrayProperty<E extends object, IdKey extends string = 'id'> = {
  [K in AttrKeys<E, IdKey>]: Exclude<E[K], null | undefined> extends never
    ? never
    : IsArray<Exclude<E[K], null | undefined>> extends 1
    ? K
    : never;
}[AttrKeys<E, IdKey>];

export type ArrayPropertyType<E extends object, IdKey extends string = 'id'> = {
  [K in ArrayProperty<E, IdKey>]: TypeProps<CastArrayType<Exclude<E[K], null | undefined>>>;
};

export type NullableProperty<
  E extends object,
  IdKey extends string = 'id'
> = Union.Intersect<Object.NullableKeys<E>, AttrKeys<E, IdKey>>;

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
  props: UnionToTuple<AttrKeys<E, IdKey>>;
  propsType: PropertyWithType<E, IdKey>;
  propsArrayType: ArrayPropertyType<E, IdKey>;
  propsNullable: UnionToTuple<NullableProperty<E, IdKey>>;
  primaryColumnName: IdKey;
  primaryColumnType: PrimaryType<E, IdKey>;
  typeName: string;
  className: string;
  relations: UnionToTuple<RelationKeys<E, IdKey>>;
  relationProperty: RelationProperty<E>;
  relationFkField: Partial<Record<RelationKeys<E, IdKey>, string>>;
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
    AttrKeys<RelationType<E, IdKey, K>>
  >;
};
