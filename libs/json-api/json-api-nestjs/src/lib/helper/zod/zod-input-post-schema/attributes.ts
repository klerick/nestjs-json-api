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
} from 'zod';

import { Entity } from '../../../types';
import { FieldWithType, TypeField } from '../../orm';
import { ObjectTyped } from '../../utils';
import { nonEmptyObject } from '../zod-utils';

type TypeMapToZod = {
  [TypeField.array]: ZodOptional<ZodArray<ZodString, 'many'>>;
  [TypeField.date]: ZodOptional<ZodDate>;
  [TypeField.number]: ZodOptional<ZodNumber>;
  [TypeField.boolean]: ZodOptional<ZodBoolean>;
  [TypeField.string]: ZodOptional<ZodString | ZodEnum<[string, ...string[]]>>;
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

export const zodAttributesSchema = <E extends Entity>(
  fieldWithType: FieldWithType<E>
): ZodAttributesSchema<E> => {
  const shape = ObjectTyped.entries(fieldWithType).reduce(
    (acum, [props, type]: [keyof FieldWithType<E>, TypeField]) => {
      let zodShema: TypeMapToZod[typeof type];
      switch (type) {
        case TypeField.array:
          zodShema = z.string().array().optional();
          break;
        case TypeField.date:
          zodShema = z.coerce.date().optional();
          break;
        case TypeField.number:
          zodShema = z.number().optional();
          break;
        case TypeField.boolean:
          zodShema = z.boolean().optional();
          break;
        case TypeField.string:
          zodShema = z.string().optional();
          break;
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
