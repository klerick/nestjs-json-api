import {EntityTarget} from 'typeorm/common/EntityTarget';
import {ObjectLiteral} from 'typeorm/common/ObjectLiteral';
import {Entity} from '../../types';

export const nameIt = (name, cls) => ({[name] : class extends cls {
  constructor(...arg) {
    super(...arg);
  }
}})[name];

export const getEntityName = <Entity extends ObjectLiteral>(entity: EntityTarget<Entity>): string => {
  if (typeof entity  === 'string'){
    return entity;
  }

  if ('name' in entity) {
    return entity['name']
  }

  if ('constructor' in entity && 'name' in entity.constructor) {
    return entity['constructor']['name']
  }
}

export function isString<T, P extends T>(value: T): value is P {
  return typeof value === 'string' || value instanceof String;
}

export function snakeToCamel(str: string): string {
  return str.toLowerCase().replace(/([-_][a-z])/g, group =>
    group
      .toUpperCase()
      .replace('-', '')
      .replace('_', '')
  );
}

export function camelToKebab(str: string): string {
  return str.replace(/((?<=[a-z\d])[A-Z]|(?<=[A-Z\d])[A-Z](?=[a-z]))/g, '-$1').toLowerCase()
}

export function upperFirstLetter(string: string): string{
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function getProviderName(entity: EntityTarget<Entity>, name: string){
  const entityName = getEntityName(entity);
  return `${upperFirstLetter(entityName)}${name}`
}
