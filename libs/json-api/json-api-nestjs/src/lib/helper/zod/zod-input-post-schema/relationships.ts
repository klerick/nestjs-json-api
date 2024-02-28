import { ZodArray, ZodEffects, ZodObject, ZodOptional, z } from 'zod';
import { Entity, EntityRelation } from '../../../types';
import {
  ArrayPropsForEntity,
  RelationPrimaryColumnType,
  RelationPropsType,
  RelationPropsTypeName,
} from '../../orm';

import { zodDataSchema, ZodDataSchema } from './data';
import { nonEmptyObject } from '../zod-utils';
import { ObjectTyped, camelToKebab } from '../../utils';

export type PropsArray<E extends Entity> = Omit<
  ArrayPropsForEntity<E>,
  'target'
>;

export type DataArray<S extends string> = ZodArray<
  ZodDataSchema<S>,
  'atleastone'
>;

export type DataItem<E extends boolean> = ZodOptional<
  E extends true ? DataArray<string> : ZodDataSchema<string>
>;

export type ShapeRelationships<E extends Entity> = {
  [K in keyof RelationPropsType<E>]: DataItem<RelationPropsType<E>[K]>;
};

export type ZodRelationshipsSchema<E extends Entity> = ZodEffects<
  ZodObject<ShapeRelationships<E>, 'strict'>
>;
export const zodRelationshipsSchema = <E extends Entity>(
  relationArrayProps: RelationPropsType<E>,
  relationPopsName: RelationPropsTypeName<E>,
  primaryColumnType: RelationPrimaryColumnType<E>
): ZodRelationshipsSchema<E> => {
  const shape = ObjectTyped.entries(relationArrayProps).reduce(
    (acum, [props, value]: [EntityRelation<E>, boolean]) => {
      const typeName = camelToKebab(relationPopsName[props]);
      const primaryType = primaryColumnType[props];
      const zodDataSchemaObject = zodDataSchema(typeName, primaryType);
      const dataItem: DataItem<typeof value> = (
        value ? z.array(zodDataSchemaObject).nonempty() : zodDataSchemaObject
      ).optional();
      return {
        ...acum,
        [props]: dataItem,
      };
    },
    {} as ShapeRelationships<E>
  );
  return z.object(shape).strict().refine(nonEmptyObject());
};
