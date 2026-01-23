import { kebabCase } from 'change-case-commonjs';

import { ID_KEY } from '../constants';
import { JsonApiSdkConfig, JsonSdkConfig } from '../types';

const NULL_REF = Symbol('null-ref');

/**
 * Marker for null relationship.
 * Returns null for TypeScript but object with Symbol marker for runtime.
 */
export function nullRef(): null {
  return { [NULL_REF]: true } as unknown as null;
}

/**
 * Checks if value is a nullRef marker
 */
export function isNullRef(val: unknown): boolean {
  return val !== null && typeof val === 'object' && NULL_REF in val;
}

export function isRelation(val: any): boolean {
  // nullRef is a special case - it's a relationship that should be null
  if (isNullRef(val)) return true;

  const result = !(
    val === null ||
    !val ||
    ['String', 'Boolean', 'Number', 'Date'].includes(val.constructor.name)
  );

  if (!result) return result;
  return ID_KEY in val;
}

export function getTypeForReq(str: string): string {
  return kebabCase(str).toLowerCase();
}

export function resultConfig(partialConfig: JsonSdkConfig): JsonApiSdkConfig {
  return {
    ...partialConfig,
    idKey: partialConfig.idKey ? partialConfig.idKey : ID_KEY,
    idIsNumber:
      partialConfig.idIsNumber === undefined
        ? true
        : !!partialConfig.idIsNumber,
    dateFields: partialConfig.dateFields ? partialConfig.dateFields : [],
  };
}
