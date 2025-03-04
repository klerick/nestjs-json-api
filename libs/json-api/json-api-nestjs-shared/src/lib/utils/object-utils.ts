import { pascalCase } from 'change-case-commonjs';

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

export function isString<T, P extends T>(value: T): value is P {
  return typeof value === 'string' || value instanceof String;
}

export function createEntityInstance<E>(name: string): E {
  const entityName = pascalCase(name);
  return Function('return new class ' + entityName + '{}')();
}

export const getEntityName = (entity: unknown): string => {
  if (entity === null) throw new Error('Entity is null');

  if (typeof entity === 'string') {
    return entity;
  }

  if (typeof entity === 'object' && 'name' in entity) {
    return `${entity['name']}`;
  }

  if (
    typeof entity === 'object' &&
    'constructor' in entity &&
    'name' in entity.constructor
  ) {
    return entity['constructor']['name'];
  }

  if (
    typeof entity === 'function' &&
    'constructor' in entity.prototype &&
    'name' in entity.prototype.constructor
  ) {
    return entity.prototype.constructor.name;
  }

  throw new Error('Entity is not object');
};
