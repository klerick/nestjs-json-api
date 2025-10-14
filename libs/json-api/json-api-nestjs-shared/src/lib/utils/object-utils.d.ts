export declare const ObjectTyped: {
    keys: <T extends {}>(yourObject: T) => Array<keyof T>;
    values: <U extends {}>(yourObject: U) => Array<U[keyof U]>;
    entries: <O extends {}>(yourObject: O) => Array<[keyof O, O[keyof O]]>;
    fromEntries: <K extends string, V>(yourObjectEntries: [K, V][]) => Record<K, V>;
};
export declare function isObject(item: unknown): item is object;
export declare function isString<T, P extends T>(value: T): value is P;
export declare function createEntityInstance<E>(name: string): E;
export declare const getEntityName: (entity: unknown) => string;
