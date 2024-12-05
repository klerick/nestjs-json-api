import {
  ZodArray,
  ZodBoolean,
  ZodEnum,
  ZodNumber,
  ZodString,
  z,
  ZodDate,
  ZodObject,
  ZodEffects,
  ZodOptional,
  ZodNullable,
  ZodType,
} from 'zod';

import { Entity } from '../../../types';
import {
  FieldWithType,
  PropsFieldItem,
  PropsForField,
  TypeField,
} from '../../orm';
import { ObjectTyped } from '../../utils';
import { nonEmptyObject } from '../zod-utils';

const literalSchema = z.union([z.string(), z.number(), z.boolean()]);

const getZodSchemaForJson = (isNull: boolean) => {
  const tmpSchema = isNull ? literalSchema.nullable() : literalSchema;
  const jsonSchema: any = z.lazy(() =>
    z.union([
      tmpSchema,
      z.array(jsonSchema.nullable()),
      z.record(jsonSchema.nullable()),
    ])
  );

  return jsonSchema;
};

type Literal = ReturnType<typeof getZodSchemaForJson>;

type Json = Literal | { [key: string]: Json } | Json[];

type ZodTypeForArray =
  | ZodString
  | ZodDate
  | ZodEffects<ZodNumber, number, unknown>
  | ZodBoolean;
type ZodArrayType =
  | ZodArray<ZodTypeForArray, 'many'>
  | ZodNullable<ZodArray<ZodTypeForArray, 'many'>>;

type TypeMapToZod = {
  [TypeField.array]: ZodOptional<ZodArrayType>;
  [TypeField.date]: ZodOptional<ZodDate | ZodNullable<ZodDate>>;
  [TypeField.number]: ZodOptional<
    | ZodEffects<ZodNumber, number, unknown>
    | ZodNullable<ZodEffects<ZodNumber, number, unknown>>
  >;
  [TypeField.boolean]: ZodOptional<ZodBoolean | ZodNullable<ZodBoolean>>;
  [TypeField.string]: ZodOptional<
    | ZodString
    | ZodEnum<[string, ...string[]]>
    | ZodNullable<ZodString | ZodEnum<[string, ...string[]]>>
  >;
  [TypeField.object]: ZodType<Json> | ZodNullable<ZodType<Json>>;
};

type ZodShapeAttributes<E extends Entity> = Omit<
  {
    [K in keyof FieldWithType<E>]: TypeMapToZod[FieldWithType<E>[K]];
  },
  'id'
>;

export type ZodAttributesSchema<E extends Entity> = ZodEffects<
  ZodObject<ZodShapeAttributes<E>, 'strict'>
>;

function getZodSchemaForArray(props: PropsFieldItem): ZodTypeForArray {
  if (!props) return z.string();
  let zodSchema: ZodTypeForArray;
  switch (props.type) {
    case 'number':
    case 'real':
    case 'integer':
    case 'bigint':
    case 'double':
    case 'numeric':
    case Number:
      zodSchema = z.preprocess((x) => Number(x), z.number());
      break;
    case 'date':
    case Date:
      zodSchema = z.coerce.date();
      break;
    case 'boolean':
    case Boolean:
      zodSchema = z.boolean();
      break;
    default:
      zodSchema = z.string();
  }

  return zodSchema;
}

export const zodAttributesSchema = <E extends Entity>(
  fieldWithType: FieldWithType<E>,
  propsDb: PropsForField<E>
): ZodAttributesSchema<E> => {
  const shape = ObjectTyped.entries(fieldWithType).reduce(
    (acum, [props, type]: [keyof FieldWithType<E>, TypeField]) => {
      let zodShema: TypeMapToZod[typeof type];
      const propsDbType = propsDb[props];
      switch (type) {
        case TypeField.array: {
          const tmpSchema = getZodSchemaForArray(propsDbType).array();
          zodShema = (
            propsDbType && propsDbType.isNullable
              ? tmpSchema.nullable()
              : tmpSchema
          ).optional();
          break;
        }
        case TypeField.date: {
          const tmpSchema = z.coerce.date();
          zodShema = (
            propsDbType && propsDbType.isNullable
              ? tmpSchema.nullable()
              : tmpSchema
          ).optional();
          break;
        }
        case TypeField.number: {
          const tmpSchema = z.preprocess((x) => Number(x), z.number());
          zodShema = (
            propsDbType && propsDbType.isNullable
              ? tmpSchema.nullable()
              : tmpSchema
          ).optional();
          break;
        }
        case TypeField.boolean: {
          const tmpSchema = z.boolean();
          zodShema = (
            propsDbType && propsDbType.isNullable
              ? tmpSchema.nullable()
              : tmpSchema
          ).optional();
          break;
        }
        case TypeField.object: {
          zodShema = getZodSchemaForJson(propsDbType.isNullable).optional();
          break;
        }
        case TypeField.string: {
          const tmpSchema = z.string();
          zodShema = (
            propsDbType && propsDbType.isNullable
              ? tmpSchema.nullable()
              : tmpSchema
          ).optional();
          break;
        }
      }

      return {
        ...acum,
        [props]: zodShema,
      };
    },
    {} as ZodShapeAttributes<E>
  );

  return z.object(shape).strict().refine(nonEmptyObject);
};
