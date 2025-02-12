import { KebabToCamelCase, KebabCase } from '../types';

export function isString<T, P extends T>(value: T): value is P {
  return typeof value === 'string' || value instanceof String;
}

export function snakeToCamel(str: string): string {
  if (!str.match(/[\s_-]/g)) {
    return str;
  }
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

export function camelToKebab<S extends string>(string: S): KebabCase<S> {
  return string
    .replace(/((?<=[a-z\d])[A-Z]|(?<=[A-Z\d])[A-Z](?=[a-z]))/g, '-$1')
    .toLowerCase() as KebabCase<S>;
}

export function upperFirstLetter<S extends string>(string: S): Capitalize<S> {
  return (string.charAt(0).toUpperCase() + string.slice(1)) as Capitalize<S>;
}

export function kebabToCamel<S extends string>(str: S): KebabToCamelCase<S> {
  return str
    .split('-')
    .map((i) => i.charAt(0).toUpperCase() + i.substring(1))
    .join('') as KebabToCamelCase<S>;
}

export function capitalizeFirstChar(str: string) {
  return str
    .split('-')
    .map((i) => i.charAt(0).toUpperCase() + i.substring(1))
    .join('');
}
