import { EntityTarget } from 'typeorm/common/EntityTarget';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';
import { Type } from '@nestjs/common/interfaces';
import { JSON_API_DECORATOR_ENTITY } from '../constants';

import { Entity } from '../types';

import { upperFirstLetter } from 'shared-utils';

export {
  camelToKebab,
  snakeToCamel,
  kebabToCamel,
  upperFirstLetter,
  isString,
  ObjectTyped,
} from 'shared-utils';

export const nameIt = (
  name: string,
  cls: new (...rest: unknown[]) => Record<never, unknown>
) =>
  ({
    [name]: class extends cls {
      constructor(...arg: unknown[]) {
        super(...arg);
      }
    },
  }[name]);

export const getEntityName = <Entity extends ObjectLiteral>(
  entity: EntityTarget<Entity>
): string => {
  if (typeof entity === 'string') {
    return entity;
  }

  if ('name' in entity) {
    return entity['name'];
  }

  if ('constructor' in entity && 'name' in entity.constructor) {
    return entity['constructor']['name'];
  }

  return `${entity}`;
};

export function getProviderName(entity: EntityTarget<Entity>, name: string) {
  const entityName = getEntityName(entity);
  return `${upperFirstLetter(entityName)}${name}`;
}

export function entityForClass<T = any>(type: Type<T>): Entity {
  return Reflect.getMetadata(JSON_API_DECORATOR_ENTITY, type);
}
