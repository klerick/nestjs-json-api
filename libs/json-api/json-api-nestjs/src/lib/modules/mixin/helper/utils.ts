import { EntityTarget, ObjectLiteral } from '../../../types';

import { upperFirstLetter } from '../../../utils/nestjs-shared';

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

export function getProviderName<Entity extends ObjectLiteral>(
  entity: EntityTarget<Entity>,
  name: string
) {
  const entityName = getEntityName(entity);
  return `${upperFirstLetter(entityName)}${name}`;
}
