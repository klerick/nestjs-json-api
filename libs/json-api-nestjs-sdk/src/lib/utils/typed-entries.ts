type TupleEntry<T extends readonly unknown[], I extends unknown[] = [], R = never> =
  T extends readonly [infer Head, ...infer Tail] ?
    TupleEntry<Tail, [...I, unknown], R | [`${I['length']}`, Head]> :
    R

// eslint-disable-next-line @typescript-eslint/ban-types
type ObjectEntry<T extends {}> =
  T extends object ?
    { [K in keyof T]: [K, Required<T>[K]] }[keyof T] extends infer E ?
      E extends [infer K, infer V] ?
        K extends string | number ?
          [`${K}`, V] :
          never :
        never :
      never :
    never

// eslint-disable-next-line @typescript-eslint/ban-types
export type Entry<T extends {}> =
  T extends readonly [unknown, ...unknown[]] ?
    TupleEntry<T> :
    T extends ReadonlyArray<infer U> ?
      [`${number}`, U] :
      ObjectEntry<T>

export type ObjectKeys<T> =
  T extends object ? (keyof T)[] :
    T extends number ? [] :
      T extends Array<any> | string ? string[] :
        never;

export function typedKeys<T extends {}>(object: T): ObjectKeys<T>{
  return Object.keys(object) as unknown as ObjectKeys<T>
}

export function typedEntries<T extends {}>(object: T): ReadonlyArray<Entry<T>> {
  return Object.entries(object) as unknown as ReadonlyArray<Entry<T>>;
}
