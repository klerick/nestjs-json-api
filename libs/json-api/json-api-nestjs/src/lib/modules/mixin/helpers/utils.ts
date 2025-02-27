import { getEntityName, ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { pascalCase } from 'change-case-commonjs';

import { AnyEntity, EntityClass } from '../../../types';
import { MethodName } from '../types';

import { Bindings } from '../config/bindings';
import { Type } from '@nestjs/common/interfaces';
import { JSON_API_DECORATOR_ENTITY } from '../../../constants';

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

export function getProviderName<Entity extends object>(
  entity: EntityClass<Entity>,
  name: string
) {
  const entityName = getEntityName(entity);
  return `${pascalCase(entityName)}${name}`;
}

export function excludeMethod(
  names: Array<Partial<MethodName>>
): Array<MethodName> {
  const tmpObject = names.reduce(
    (acum, key) => ((acum[key] = true), acum),
    {} as Record<Partial<MethodName>, boolean>
  );
  return ObjectTyped.keys(Bindings).filter(
    (method) => !tmpObject[method]
  ) as Array<MethodName>;
}

export function entityForClass<T = any>(type: Type<T>): EntityClass<AnyEntity> {
  return Reflect.getMetadata(JSON_API_DECORATOR_ENTITY, type);
}
