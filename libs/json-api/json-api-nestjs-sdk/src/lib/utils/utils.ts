import { kebabCase } from 'change-case-commonjs';

import { ID_KEY } from '../constants';
import { JsonApiSdkConfig, JsonSdkConfig } from '../types';

export function isRelation(val: any): boolean {
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
