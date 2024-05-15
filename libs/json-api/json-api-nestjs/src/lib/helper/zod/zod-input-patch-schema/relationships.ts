import {
  ZodArray,
  ZodEffects,
  ZodObject,
  ZodOptional,
  z,
  ZodNullable,
} from 'zod';
import { Entity, EntityRelation } from '../../../types';
import {
  RelationPrimaryColumnType,
  RelationPropsType,
  RelationPropsTypeName,
} from '../../orm';

import { zodDataSchema, ZodDataSchema } from '../zod-input-post-schema/data';
import { nonEmptyObject } from '../zod-utils';
import { ObjectTyped, camelToKebab } from '../../utils';

export type DataArray<S extends string> = ZodArray<ZodDataSchema<S>>;

export type DataItem<E extends boolean> = ZodOptional<
  E extends true ? DataArray<string> : ZodNullable<ZodDataSchema<string>>
>;

export type ShapeRelationships<E extends Entity> = {
  [K in keyof RelationPropsType<E>]: DataItem<RelationPropsType<E>[K]>;
};

export type ZodPatchRelationshipsSchema<E extends Entity> = ZodEffects<
  ZodObject<ShapeRelationships<E>, 'strict'>
>;
export const zodPatchRelationshipsSchema = <E extends Entity>(
  relationArrayProps: RelationPropsType<E>,
  relationPopsName: RelationPropsTypeName<E>,
  primaryColumnType: RelationPrimaryColumnType<E>
): ZodPatchRelationshipsSchema<E> => {
  const shape = ObjectTyped.entries(relationArrayProps).reduce(
    (acum, [props, value]: [EntityRelation<E>, boolean]) => {
      const typeName = camelToKebab(relationPopsName[props]);
      const primaryType = primaryColumnType[props];
      const zodDataSchemaObject = zodDataSchema(typeName, primaryType);
      const dataItem: DataItem<typeof value> = (
        value ? z.array(zodDataSchemaObject) : zodDataSchemaObject.nullable()
      ).optional();
      return {
        ...acum,
        [props]: z.union([
          dataItem,
          z
            .object({ data: dataItem })
            .strict()
            .refine(nonEmptyObject())
            .transform((i) => {
              const { data } = i;
              return data;
            }),
        ]),
      };
    },
    {} as ShapeRelationships<E>
  );
  return z.object(shape).strict().refine(nonEmptyObject());
};
