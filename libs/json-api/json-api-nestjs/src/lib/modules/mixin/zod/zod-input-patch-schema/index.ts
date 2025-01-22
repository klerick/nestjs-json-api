import { z, ZodObject, ZodOptional } from 'zod';
import {
  zodAttributes,
  ZodAttributes,
  zodId,
  ZodId,
  zodRelationships,
  ZodRelationships,
  zodType,
  ZodType,
} from '../zod-share';
import { ObjectLiteral } from '../../../../types';
import {
  EntityProps,
  FieldWithType,
  PropsForField,
  RelationPrimaryColumnType,
  RelationPropsArray,
  RelationPropsTypeName,
  TypeForId,
} from '../../types';
import { ZodPost } from '../zod-input-post-schema';

type ZodPatchPatchShape<E extends ObjectLiteral, N extends string> = {
  id: ZodId;
  type: ZodType<N>;
  attributes: ZodOptional<ZodAttributes<E, true>>;
  relationships: ZodOptional<ZodRelationships<E, true>>;
};

type ZodInputPatchSchema<E extends ObjectLiteral, N extends string> = ZodObject<
  ZodPatchPatchShape<E, N>,
  'strict'
>;

type ZodInputPatchDataShape<E extends ObjectLiteral, N extends string> = {
  data: ZodInputPatchSchema<E, N>;
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
): ZodInputPatchSchema<E, N> {
  const shape = {
    id: zodId(typeId),
    type: zodType(typeName),
    attributes: zodAttributes(
      fieldWithType,
      propsDb,
      primaryColumn,
      true
    ).optional(),
    relationships: zodRelationships(
      relationArrayProps,
      relationPopsName,
      primaryColumnType,
      true
    ).optional(),
  };

  return z.object(shape).strict();
}

function zodDataShape<E extends ObjectLiteral, N extends string>(
  shape: ZodInputPatchSchema<E, N>
): ZodPatch<E, N> {
  return z
    .object({
      data: shape,
    })
    .strict();
}

export function zodPatch<E extends ObjectLiteral, N extends string>(
  typeId: TypeForId,
  typeName: N,
  fieldWithType: FieldWithType<E>,
  propsDb: PropsForField<E>,
  primaryColumn: EntityProps<E>,
  relationArrayProps: RelationPropsArray<E>,
  relationPopsName: RelationPropsTypeName<E>,
  primaryColumnType: RelationPrimaryColumnType<E>
): ZodPatch<E, N> {
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

export type ZodPatch<E extends ObjectLiteral, N extends string> = ZodObject<
  ZodInputPatchDataShape<E, N>,
  'strict'
>;
export type PatchData<
  E extends ObjectLiteral,
  N extends string = string
> = z.infer<ZodPost<E, N>>['data'];
