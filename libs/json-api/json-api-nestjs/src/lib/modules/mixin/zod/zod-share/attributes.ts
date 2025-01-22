import {
  EntityProps,
  ObjectTyped,
  TypeOfArray,
} from '@klerick/json-api-nestjs-shared';
import { z, ZodArray, ZodNullable } from 'zod';

import { ObjectLiteral } from '../../../../types';
import {
  FieldWithType,
  PropsFieldItem,
  PropsForField,
  TypeField,
} from '../../types';
import { nonEmptyObject } from '../zod-utils';

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

function getZodRulesForNumber(isNullable: boolean) {
  const schema = z.preprocess((x) => Number(x), z.number());
  if (isNullable) schema.nullable().optional();
  return isNullable ? schema.optional() : schema;
}

function getZodRulesForString(isNullable: boolean) {
  const schema = z.string();
  if (isNullable) schema.nullable().optional();
  return isNullable ? schema.optional() : schema;
}

function getZodRulesForDate(isNullable: boolean) {
  const schema = z.coerce.date();
  if (isNullable) schema.nullable().optional();
  return isNullable ? schema.optional() : schema;
}

function getZodRulesForBoolean(isNullable: boolean) {
  const schema = z.boolean();
  if (isNullable) schema.nullable();
  return isNullable ? schema.optional() : schema;
}

function getZodSchemaForJson(isNullable: boolean) {
  const tmpSchema = isNullable ? literalSchema.nullable() : literalSchema;

  const schema: z.ZodType<Json> = z.lazy(() =>
    z.union([tmpSchema, z.array(tmpSchema), z.record(tmpSchema)])
  );

  return isNullable ? schema.optional() : schema;
}

function getZodRulesForArray<T>(
  propsField: PropsFieldItem
):
  | ZodArray<ZodRulesForArray<T>, 'many'>
  | ZodNullable<ZodArray<ZodRulesForArray<T>, 'many'>> {
  const type = propsField.type as T;
  let schema: ZodRulesForArray<T>;

  if (!propsField) {
    schema = getZodRulesForString(false) as ZodRulesForArray<T>;
  } else {
    switch (type) {
      case 'number':
      case 'real':
      case 'integer':
      case 'bigint':
      case 'double':
      case 'numeric':
      case Number:
        schema = getZodRulesForNumber(false) as ZodRulesForArray<T>;
        break;
      case 'date':
      case Date:
        schema = getZodRulesForDate(false) as ZodRulesForArray<T>;
        break;
      case 'boolean':
      case Boolean:
        schema = getZodRulesForBoolean(false) as ZodRulesForArray<T>;
        break;
      default:
        schema = getZodRulesForString(false) as ZodRulesForArray<T>;
    }
  }

  if (propsField.isNullable) {
    return schema.array().nullable() as ZodNullable<
      ZodArray<ZodRulesForArray<T>, 'many'>
    >;
  }
  return schema.array() as ZodArray<ZodRulesForArray<T>, 'many'>;
}

type ZodRulesForArray<T> = T extends number
  ? ReturnType<typeof getZodRulesForNumber>
  : T extends Date
  ? ReturnType<typeof getZodRulesForDate>
  : T extends boolean
  ? ReturnType<typeof getZodRulesForBoolean>
  : ReturnType<typeof getZodRulesForString>;

type ZodRulesForType<T extends TypeField, I> = ReturnType<
  T extends TypeField.array
    ? typeof getZodRulesForArray<I>
    : T extends TypeField.date
    ? typeof getZodRulesForDate
    : T extends TypeField.boolean
    ? typeof getZodRulesForBoolean
    : T extends TypeField.number
    ? typeof getZodRulesForNumber
    : T extends TypeField.object
    ? typeof getZodSchemaForJson
    : typeof getZodRulesForString
>;

function buildSchema<T extends TypeField, P extends PropsFieldItem, I>(
  fieldType: T,
  propsField: P
): ZodRulesForType<T, I> {
  let schema: ZodRulesForType<T, I>;
  switch (fieldType) {
    case TypeField.array:
      schema = getZodRulesForArray<I>(propsField) as ZodRulesForType<T, I>;
      break;
    case TypeField.date:
      schema = getZodRulesForDate(propsField.isNullable) as ZodRulesForType<
        T,
        I
      >;
      break;
    case TypeField.boolean:
      schema = getZodRulesForBoolean(propsField.isNullable) as ZodRulesForType<
        T,
        I
      >;
      break;
    case TypeField.number:
      schema = getZodRulesForNumber(propsField.isNullable) as ZodRulesForType<
        T,
        I
      >;
      break;
    case TypeField.object:
      schema = getZodSchemaForJson(propsField.isNullable) as ZodRulesForType<
        T,
        I
      >;
      break;
    default:
      schema = getZodRulesForString(propsField.isNullable) as ZodRulesForType<
        T,
        I
      >;
  }

  return schema;
}

export function zodAttributes<
  E extends ObjectLiteral,
  S extends true | false = false
>(
  fieldWithType: FieldWithType<E>,
  propsDb: PropsForField<E>,
  primaryColumn: EntityProps<E>,
  isPatch: S
) {
  const objectShape = {} as {
    [K in keyof Omit<FieldWithType<E>, keyof EntityProps<E>>]: ZodRulesForType<
      FieldWithType<E>[K],
      TypeOfArray<E[K]>
    >;
  };

  for (const [nameList, type] of ObjectTyped.entries(fieldWithType)) {
    if (nameList === primaryColumn) continue;
    const name = nameList as keyof Omit<FieldWithType<E>, keyof EntityProps<E>>;
    const propsField = propsDb[name];
    objectShape[name] = buildSchema<
      typeof type,
      typeof propsField,
      TypeOfArray<E[typeof name]>
    >(type, propsField || {});
  }
  const zodSchema = z.object(objectShape).strict();
  if (isPatch) {
    return zodSchema.partial().refine(nonEmptyObject());
  }
  return zodSchema.refine(nonEmptyObject());
}

export type ZodAttributes<
  E extends ObjectLiteral,
  K extends true | false = false
> = ReturnType<typeof zodAttributes<E, K>>;
export type Attributes<
  E extends ObjectLiteral,
  K extends true | false = false
> = z.infer<ZodAttributes<E, K>>;
