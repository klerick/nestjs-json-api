import { kebabToCamel } from './string-utils';

export const ObjectTyped = {
  keys: Object.keys as <T extends {}>(yourObject: T) => Array<keyof T>,
  values: Object.values as <U extends {}>(yourObject: U) => Array<U[keyof U]>,
  entries: Object.entries as <O extends {}>(
    yourObject: O
  ) => Array<[keyof O, O[keyof O]]>,
  fromEntries: Object.fromEntries as <K extends string, V>(
    yourObjectEntries: [K, V][]
  ) => Record<K, V>,
};

export function isObject(item: unknown): item is object {
  return typeof item === 'object' && !Array.isArray(item) && item !== null;
}

export function createEntityInstance<E>(name: string): E {
  const entityName = kebabToCamel(name);
  return Function('return new class ' + entityName + '{}')();
}
