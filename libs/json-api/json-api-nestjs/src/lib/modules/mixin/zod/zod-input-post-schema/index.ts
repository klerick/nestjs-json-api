import { z, ZodObject, ZodOptional } from 'zod';

import { ObjectLiteral } from '../../../../types';
import {
  ZodId,
  zodId,
  ZodType,
  zodType,
  ZodAttributes,
  zodAttributes,
  ZodRelationships,
  zodRelationships,
} from '../zod-share';
import {
  EntityProps,
  FieldWithType,
  PropsForField,
  RelationPrimaryColumnType,
  RelationPropsArray,
  RelationPropsTypeName,
  TypeForId,
} from '../../types';

type ZodInputPostShape<E extends ObjectLiteral, N extends string> = {
  id: ZodOptional<ZodId>;
  type: ZodType<N>;
  attributes: ZodAttributes<E>;
  relationships: ZodOptional<ZodRelationships<E>>;
};

type ZodInputPostSchema<E extends ObjectLiteral, N extends string> = ZodObject<
  ZodInputPostShape<E, N>,
  'strict'
>;

type ZodInputPostDataShape<E extends ObjectLiteral, N extends string> = {
  data: ZodInputPostSchema<E, N>;
};

function getShape<E extends ObjectLiteral, N extends string>(
  typeId: TypeForId,
  typeName: N,
  fieldWithType: FieldWithType<E>,
  propsDb: PropsForField<E>,
  primaryColumn: EntityProps<E>,
  relationArrayProps: RelationPropsArray<E>,
  relationPopsName: RelationPropsTypeName<E>,
  primaryColumnType: RelationPrimaryColumnType<E>
): ZodInputPostSchema<E, N> {
  const shape = {
    id: zodId(typeId).optional(),
    type: zodType(typeName),
    attributes: zodAttributes(fieldWithType, propsDb, primaryColumn, false),
    relationships: zodRelationships(
      relationArrayProps,
      relationPopsName,
      primaryColumnType,
      false
    ).optional(),
  };

  return z.object(shape).strict();
}

function zodDataShape<E extends ObjectLiteral, N extends string>(
  shape: ZodInputPostSchema<E, N>
): ZodPost<E, N> {
  return z
    .object({
      data: shape,
    })
    .strict();
}

export function zodPost<E extends ObjectLiteral, N extends string>(
  typeId: TypeForId,
  typeName: N,
  fieldWithType: FieldWithType<E>,
  propsDb: PropsForField<E>,
  primaryColumn: EntityProps<E>,
  relationArrayProps: RelationPropsArray<E>,
  relationPopsName: RelationPropsTypeName<E>,
  primaryColumnType: RelationPrimaryColumnType<E>
): ZodPost<E, N> {
  const shape = getShape(
    typeId,
    typeName,
    fieldWithType,
    propsDb,
    primaryColumn,
    relationArrayProps,
    relationPopsName,
    primaryColumnType
  );

  return zodDataShape(shape);
}

export type ZodPost<E extends ObjectLiteral, N extends string> = ZodObject<
  ZodInputPostDataShape<E, N>,
  'strict'
>;
export type Post<E extends ObjectLiteral, N extends string = string> = z.infer<
  ZodPost<E, N>
>;
export type PostData<E extends ObjectLiteral, N extends string = string> = Post<
  E,
  N
>['data'];
