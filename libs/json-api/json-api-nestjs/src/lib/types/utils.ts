import { Type } from '@nestjs/common/interfaces';
import { EntityField, EntityProps, EntityRelation } from 'json-shared-type';

import { Entity } from './module.types';

export { EntityField, EntityProps, EntityRelation };

export type EntityPropsArray<T> = {
  [P in keyof T]: T[P] extends EntityField
    ? IsArray<T[P]> extends true
      ? P
      : never
    : never;
}[keyof T];

type UnionToIntersection<U> = (
  U extends never ? never : (arg: U) => never
) extends (arg: infer I) => void
  ? I
  : never;

export type UnionToTupleMain<T, A extends unknown[] = []> = UnionToIntersection<
  T extends never ? never : (t: T) => T
> extends (_: never) => infer W
  ? UnionToTupleMain<Exclude<T, W>, [...A, W]>
  : A;

export type UnionToTuple<T> = UnionToTupleMain<T> extends readonly [
  string,
  ...string[]
]
  ? UnionToTupleMain<T>
  : never;

export type TypeCast<A, T> = A extends T ? A : never;

export type TypeOfArray<T> = T extends (infer U)[] ? U : T;

export type CastProps<E extends Entity, K> = K extends keyof E ? E[K] : never;

export type TypeFromType<T> = T extends Type<infer A> ? A : never;

export type ConcatStringArray<T extends string[]> = T extends [
  infer F extends string,
  ...infer R extends string[]
]
  ? `${F}${ConcatStringArray<R>}`
  : '';

export type Concat<E extends string, F extends string> = ConcatStringArray<
  [E, '.', F]
>;

export type ValueOf<T> = T[keyof T];

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export type IsArray<T> = T extends unknown[] ? true : false;

export type IsPropertyIsArray<E, P extends EntityProps<E>> = IsArray<E[P]>;
