import { ObjectTyped } from '@klerick/json-api-nestjs-shared';

import { ZodType } from 'zod';

import { EntityRelationProps, TypeField } from '../../../types';
import { EntityParamMapService } from '../service';
import { ResultSchema } from './zod-share';

export const nonEmptyObject =
  () =>
    <T>(object: T) =>
      !!(typeof object === 'object' && object && Object.keys(object).length > 0);

export const uniqueArray = () => (e: string[]) => new Set(e).size === e.length;

export const getValidationErrorForStrict = (
  props: string[],
  name: 'Fields' | 'Filter'
) =>
  `Validation error: ${name} should be have only props: ["${props.join(
    '","'
  )}"]`;

export const oneOf = (keys: string[]) => (val: any) => {
  if (!val) return false;
  for (const k of keys) {
    if (val[k] !== undefined) return true;
  }
  return false;
};

export const stringLongerThan =
  (length = 0) =>
    (str: string) =>
      str.length > length;

export const arrayItemStringLongerThan =
  (length = 0) =>
    (array: Array<string | null>) => {
      const checkFunction = stringLongerThan(length);
      return !array.some((i) => i !== null && !checkFunction(i));
    };

export const stringMustBe =
  (type: TypeField = TypeField.string) =>
    (inputString: string | null) => {
      if (inputString === null) return true;
      switch (type) {
        case TypeField.boolean:
          return inputString === 'true' || inputString === 'false';
        case TypeField.number:
          return !isNaN(+inputString);
        case TypeField.date:
          return new Date(inputString).toString() !== 'Invalid Date';
        default:
          return true;
      }
    };

export const elementOfArrayMustBe =
  (type: TypeField = TypeField.string) =>
    (inputArray: unknown[]) => {
      const checkFunc = stringMustBe(type);
      return !inputArray.some((i) => !checkFunc(`${i}`));
    };

export function guardIsKeyOfObject<R>(
  object: R,
  key: string | number | symbol
): asserts key is keyof R {
  if (typeof object === 'object' && object !== null && key in object)
    return void 0;

  throw new Error('Type guard error');
}

export function getRelationProps<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  return ObjectTyped.entries(
    entityParamMapService.entityParaMap.relationProperty
  ).reduce((acum, [name, value]) => {
    const relMap = entityParamMapService.getParamMap(value.entityClass as any);
    Reflect.set(acum, name, relMap.props);
    return acum;
  }, {} as EntityRelationProps<E, IdKey>);
}

export function setOptionalOrNot<
  Schema extends ZodType,
  Null extends true | false,
  isPatch extends true | false
>(
  schema: Schema,
  isNullable: Null,
  isPatch: isPatch
): ResultSchema<Schema, Null, isPatch> {
  if (isPatch) {
    return (isNullable ? schema.nullable() : schema).optional() as ResultSchema<
      Schema,
      Null,
      isPatch
    >;
  } else {
    return (isNullable ? schema.nullable().optional() : schema) as ResultSchema<
      Schema,
      Null,
      isPatch
    >;
  }
}
