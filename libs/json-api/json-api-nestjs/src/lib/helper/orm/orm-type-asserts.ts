import { Entity } from '../../types';
import {
  PropsNameResultField,
  PropertyTarget,
} from './orm-helper';

export function guardKeyForPropertyTarget<
  E extends Entity,
  For extends PropsNameResultField,
  R extends PropertyTarget<E, For>
>(relationsTargets: R, key: any): asserts key is keyof R {
  if (!(key in relationsTargets)) throw new Error('Type guard error');
}

export function guardIsKeyOfObject<R>(
  object: R,
  key:  string | number | symbol
): asserts key is keyof R {
  if (typeof object === 'object' && object !== null && key in object)
    return void 0;

  throw new Error('Type guard error');
}

export function guardIsArray<T>(input: T|Array<T>): input is Array<T>{
  return Array.isArray(input)
}
