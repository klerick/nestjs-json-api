export * from './entity-array';
export * from './typed-entries';

export function snakeToCamel(str: string): string {
  if (!str.match(/[\s_-]/g)) {
    return str;
  }
  return str
    .toLowerCase()
    .replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
}

export function camelToKebab(str: string): string {
  return str
    .replace(/((?<=[a-z\d])[A-Z]|(?<=[A-Z\d])[A-Z](?=[a-z]))/g, '-$1')
    .toLowerCase();
}

export function getTypeForReq(str: string): string {
  return camelToKebab(str).toLowerCase();
}

export function isObject(item: any) {
  return typeof item === 'object' && !Array.isArray(item) && item !== null;
}

export function capitalizeFirstChar(str: string) {
  return str
    .split('-')
    .map((i) => i.charAt(0).toUpperCase() + i.substring(1))
    .join('');
}

export class EmptyArrayRelation extends Array {
  static override get [Symbol.species]() {
    return Array;
  }
}
