import { z } from 'zod';
import {
  camelToKebab,
  KebabCase,
  ObjectTyped,
} from '@klerick/json-api-nestjs-shared';

import { ObjectLiteral } from '../../../../types';

import {
  RelationPropsArray,
  RelationPropsTypeName,
  RelationPrimaryColumnType,
  TypeForId,
} from '../../types';
import { zodRelData } from './rel-data';
import { nonEmptyObject } from '../zod-utils';

function getZodRuleForData<
  K extends string,
  P extends TypeForId,
  T extends true | false = false
>(typeName: K, primaryType: P, isPatch: T) {
  if (isPatch) {
    return zodRelData(typeName, primaryType).nullable();
  }
  return zodRelData(typeName, primaryType);
}

function getZodRuleForArrayData<
  K extends string,
  P extends TypeForId,
  T extends true | false = false
>(typeName: K, primaryType: P, isPatch: T) {
  const dataArraySchema = getZodRuleForData(
    typeName,
    primaryType,
    false
  ).array();
  if (isPatch) {
    return dataArraySchema;
  }
  return dataArraySchema.nonempty();
}

function getZodDataShape<
  K extends string,
  P extends TypeForId,
  I extends true,
  T extends true | false = false
>(
  typeName: K,
  primaryType: P,
  isArray: I,
  isPatch: T
): ReturnType<typeof getZodRuleForArrayData<K, P, T>>;
function getZodDataShape<
  K extends string,
  P extends TypeForId,
  I extends false,
  T extends true | false = false
>(
  typeName: K,
  primaryType: P,
  isArray: I,
  isPatch: T
): ReturnType<typeof getZodRuleForData<K, P, T>>;
function getZodDataShape<
  K extends string,
  P extends TypeForId,
  I extends boolean,
  T extends true | false = false
>(
  typeName: K,
  primaryType: P,
  isArray: I,
  isPatch: T
): ReturnType<
  typeof getZodRuleForArrayData<K, P, T> | typeof getZodRuleForData<K, P, T>
> {
  return isArray
    ? getZodRuleForArrayData(typeName, primaryType, isPatch)
    : getZodRuleForData(typeName, primaryType, isPatch);
}

function getZodResultData<
  K extends string,
  P extends TypeForId,
  T extends true | false = false
>(typeName: K, primaryType: P, isPatch: T) {
  return z
    .object({
      data: getZodDataShape(typeName, primaryType, false, isPatch),
    })
    .optional();
}

function getZodResultDataArray<
  K extends string,
  P extends TypeForId,
  T extends true | false = false
>(typeName: K, primaryType: P, isPatch: T) {
  return z
    .object({
      data: getZodDataShape(typeName, primaryType, true, isPatch),
    })
    .optional();
}

type ZodResultData<
  K extends string,
  P extends TypeForId,
  I extends boolean,
  T extends true | false = false
> = I extends true
  ? ReturnType<typeof getZodResultDataArray<K, P, T>>
  : ReturnType<typeof getZodResultData<K, P, T>>;

export function zodRelationships<
  E extends ObjectLiteral,
  S extends true | false = false
>(
  relationArrayProps: RelationPropsArray<E>,
  relationPopsName: RelationPropsTypeName<E>,
  primaryColumnType: RelationPrimaryColumnType<E>,
  isPatch: S
) {
  const shape = {} as {
    [K in keyof RelationPropsArray<E>]: ZodResultData<
      KebabCase<RelationPropsTypeName<E>[K]>,
      RelationPrimaryColumnType<E>[K],
      RelationPropsArray<E>[K],
      S
    >;
  };

  for (const [props, value] of ObjectTyped.entries(relationArrayProps)) {
    const typeName = camelToKebab(relationPopsName[props]);
    const primaryType = primaryColumnType[props];
    shape[props] = (
      value === true
        ? getZodResultDataArray(typeName, primaryType, isPatch)
        : getZodResultData(typeName, primaryType, isPatch)
    ) as ZodResultData<typeof typeName, typeof primaryType, typeof value>;
  }

  return z.object(shape).strict().refine(nonEmptyObject());
}

export type ZodRelationships<
  T extends ObjectLiteral,
  K extends true | false = false
> = ReturnType<typeof zodRelationships<T, K>>;
export type Relationships<
  T extends ObjectLiteral,
  K extends true | false = false
> = z.infer<ZodRelationships<T, K>>;
