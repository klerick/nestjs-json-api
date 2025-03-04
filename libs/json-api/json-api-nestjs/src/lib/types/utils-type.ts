import {
  CastIteratorType,
  HasId,
  Constructor,
} from '@klerick/json-api-nestjs-shared';
import { Any, Tuple, Union } from 'ts-toolbelt';
import { Type } from '@nestjs/common/interfaces';

export { HasId, CastIteratorType };

export type IfEquals<X, Y, A, B> = Any.Equals<X, Y> extends 1 ? A : B;

export type ExtractNestType<ArrayType> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type TypeFromType<T> = T extends Type<infer A> ? A : never;

export type UnionToTuple<
  T,
  L = Union.Last<T>,
  N = [T] extends [never] ? true : false
> = true extends N ? [] : Tuple.Append<UnionToTuple<Exclude<T, L>>, L>;

export type IsArray<T> = T extends unknown[] ? 1 : 0;
export type CastArrayType<T> = T extends (infer U)[] ? U : T;

export type TypeOfConstructor<T> = T extends Constructor<infer E> ? E : T;

export type NonEmptyStringTuple<T extends readonly any[]> = T extends []
  ? never
  : T extends readonly [infer First, ...infer Rest]
  ? First extends string
    ? Rest extends string[]
      ? readonly [First, ...Rest]
      : never
    : never
  : never;
