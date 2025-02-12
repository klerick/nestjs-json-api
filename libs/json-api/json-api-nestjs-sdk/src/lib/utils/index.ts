import { camelToKebab } from '../../shared';

import { JsonApiSdkConfig, JsonSdkConfig } from '../types';
import { ID_KEY } from '../constants';

export * from './http-params';
export * from './entity-array';
export * from './adapter-for-axios';
export * from './generate-atomic-body';

export {
  camelToKebab,
  ObjectTyped,
  capitalizeFirstChar,
  kebabToCamel,
  isObject,
} from '../../shared';

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

export function getTypeForReq(str: string): string {
  return camelToKebab(str).toLowerCase();
}

export function isRelation(val: any): boolean {
  const result = !(
    val === null ||
    !val ||
    ['String', 'Boolean', 'Number', 'Date'].includes(val.constructor.name)
  );

  if (!result) return result;
  return ID_KEY in val;
}
