export type HasId<T, IdKey extends string> = IdKey extends keyof T ? 1 : 0;

// Unwrap MikroORM Ref/Reference - cheap check first, then inference
type UnwrapReference<T> = T extends { unwrap: Function }
  ? T extends { unwrap(): infer U }
    ? U & {} // & {} prevents deep evaluation
    : T
  : T;

export type CastIteratorType<T> = T extends {
  [Symbol.iterator](): Iterator<infer U>;
}
  ? U
  : UnwrapReference<T>;

type RelationCheck<T, IdKey extends string> = T extends never
  ? 0
  : T extends Promise<infer U>
  ? RelationCheck<U, IdKey>
  : HasId<Exclude<CastIteratorType<T>, undefined>, IdKey>;

type StringKeys<E> = Extract<keyof E, string>;

type FunctionKeys<E> = {
  [K in StringKeys<E>]: E[K] extends Function ? K : never;
}[StringKeys<E>];

export type RelationKeys<E, IdKey extends string = 'id'> = {
  [K in StringKeys<E>]: Exclude<E[K], null> extends never
    ? never
    : RelationCheck<Exclude<E[K], null>, IdKey> extends 1
    ? K
    : never;
}[StringKeys<E>];

export type PropertyKeys<E, IdKey extends string = 'id'> = Exclude<
  StringKeys<E>,
  RelationKeys<E, IdKey> | FunctionKeys<E>
>;

export type AttrKeys<E, IdKey extends string = 'id'> = Exclude<
  PropertyKeys<E, IdKey>,
  IdKey
>;

export type IsIterator<T> = T extends {
  [Symbol.iterator](): Iterator<any>;
}
  ? 1
  : 0;

export type TypeOfArray<T> = T extends (infer U)[] ? U : T;

export type ValueOf<T> = T[keyof T];
export type Constructor<T> = new (...args: any[]) => T;
export type AnyEntity<T = object> = T;
export type EntityClass<T extends AnyEntity> = Constructor<T>;
