import { Any } from 'ts-toolbelt';

export type HasId<T, IdKey extends string> = Any.At<T, IdKey> extends undefined
  ? 0
  : 1;

export type CastIteratorType<T> = T extends {
  [Symbol.iterator](): Iterator<infer U>;
}
  ? U
  : T;

type RelationCheck<T, IdKey extends string> = T extends never
  ? 0
  : T extends Promise<infer U>
  ? HasId<U, IdKey>
  : HasId<CastIteratorType<T>, IdKey>;

export type RelationKeys<E, IdKey extends string = 'id'> = {
  [K in keyof E]: Exclude<E[K], null> extends never
    ? never
    : RelationCheck<Exclude<E[K], null>, IdKey> extends 1
    ? K
    : never;
}[keyof E];

export type PropertyKeys<E, IdKey extends string = 'id'> = keyof Omit<
  E,
  RelationKeys<E, IdKey>
>;

export type IsIterator<T> = T extends {
  [Symbol.iterator](): Iterator<any>;
}
  ? 1
  : 0;

export type TypeOfArray<T> = T extends (infer U)[] ? U : T;

export type ValueOf<T> = T[keyof T];
