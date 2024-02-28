import { Repository } from 'typeorm';
import { z, ZodObject } from 'zod';
import { QueryField } from 'json-shared-type';

import {
  getField,
  getPropsTreeForRepository,
  fromRelationTreeToArrayName,
  ResultGetField,
  getArrayPropsForEntity,
  getRelationTypeArray,
  getRelationTypeName,
  getRelationTypePrimaryColumn,
  getFieldWithType,
  getTypePrimaryColumn,
  getTypeForAllProps,
  FieldWithType,
} from '../orm';
import { Entity } from '../../types';

import {
  ZodInputQueryShape,
  zodSortInputQuerySchema,
  zodPageInputQuerySchema,
  zodIncludeInputQuerySchema,
  zodSelectFieldsInputQuerySchema,
  zodFilterInputQuerySchema,
} from './zod-input-query-schema';

import {
  ZodQueryShape,
  zodFilterQuerySchema,
  zodSelectFieldsQuerySchema,
  zodIncludeQuerySchema,
  zodSortQuerySchema,
  zodPageQuerySchema,
} from './zod-query-schema';

import {
  PostShape,
  zodAttributesSchema,
  zodRelationshipsSchema,
  zodTypeSchema,
} from './zod-input-post-schema';

import {
  PatchShape,
  zodPatchRelationshipsSchema,
} from './zod-input-patch-schema';

import {
  postRelationshipSchema,
  PostRelationshipSchema,
} from './zod-input-post-relationship-schema';

import {
  patchRelationshipSchema,
  PatchRelationshipSchema,
} from './zod-input-patch-relationship-schema';

import { camelToKebab, getEntityName, ObjectTyped } from '../utils';
import { zodIdSchema } from './zod-input-post-schema/id';

export { QueryField };

export type ZodInputQuerySchema<E extends Entity> = ZodObject<
  ZodInputQueryShape<E>,
  'strict'
>;

export type InputQuery<E extends Entity> = z.infer<ZodInputQuerySchema<E>>;

export type ZodQuerySchema<E extends Entity> = ZodObject<
  ZodQueryShape<E>,
  'strict'
>;

export type Query<E extends Entity> = z.infer<ZodQuerySchema<E>>;

export type TypeInputProps<
  E extends Entity,
  K extends keyof ZodInputQueryShape<E>
> = z.infer<ZodInputQueryShape<E>[K]>;

export type ZodInputPostSchema<E extends Entity> = ZodObject<
  {
    data: ZodObject<PostShape<E>, 'strict'>;
  },
  'strict'
>;

export type PostData<E extends Entity> = z.infer<ZodInputPostSchema<E>>['data'];

export type ZodInputPatchSchema<E extends Entity> = ZodObject<
  {
    data: ZodObject<PatchShape<E>, 'strict'>;
  },
  'strict'
>;

export type PatchData<E extends Entity> = z.infer<
  ZodInputPatchSchema<E>
>['data'];

export type ZodInputPostRelationshipSchema = ZodObject<
  {
    data: PostRelationshipSchema;
  },
  'strict'
>;

export type PostRelationshipData =
  z.infer<ZodInputPostRelationshipSchema>['data'];

export type ZodInputPatchRelationshipSchema = ZodObject<
  {
    data: PatchRelationshipSchema;
  },
  'strict'
>;

export type PatchRelationshipData =
  z.infer<ZodInputPatchRelationshipSchema>['data'];

export const zodInputQuerySchema = <E extends Entity>(
  repository: Repository<E>
): ZodInputQuerySchema<E> => {
  const { field, relations } = getField(repository);
  const relationTree = fromRelationTreeToArrayName(
    getPropsTreeForRepository(repository)
  );

  const zodInputQueryShape: ZodInputQueryShape<E> = {
    [QueryField.filter]: zodFilterInputQuerySchema<E>(
      field,
      relations,
      relationTree
    ).optional(),
    [QueryField.fields]:
      zodSelectFieldsInputQuerySchema<E>(relations).optional(),
    [QueryField.include]: zodIncludeInputQuerySchema.optional(),
    [QueryField.sort]: zodSortInputQuerySchema.optional(),
    [QueryField.page]: zodPageInputQuerySchema,
  };
  return z
    .object(zodInputQueryShape)
    .strict(
      `Query object should contain only allow params: "${Object.keys(
        QueryField
      ).join('"."')}"`
    );
};

export const zodQuerySchema = <E extends Entity>(
  repository: Repository<E>
): ZodQuerySchema<E> => {
  const { field, relations } = getField(repository);
  const relationTree = getPropsTreeForRepository(repository);
  const propsArray = getArrayPropsForEntity(repository);
  const typeProps = getTypeForAllProps(repository);

  const zodQueryShape: ZodQueryShape<E> = {
    [QueryField.filter]: zodFilterQuerySchema<E>(
      field,
      relationTree,
      propsArray,
      typeProps
    ),
    [QueryField.fields]: zodSelectFieldsQuerySchema<E>(
      field,
      relationTree
    ).nullable(),
    [QueryField.include]:
      zodIncludeQuerySchema<ResultGetField<E>['relations']>(
        relations
      ).nullable(),
    [QueryField.sort]: zodSortQuerySchema<E>(field, relationTree).nullable(),
    [QueryField.page]: zodPageQuerySchema,
  };

  return z.object(zodQueryShape).strict();
};

export const zodInputPostSchema = <E extends Entity>(
  repository: Repository<E>
): ZodInputPostSchema<E> => {
  const relationArrayProps = getRelationTypeArray(repository);
  const relationPopsName = getRelationTypeName(repository);
  const primaryColumnType = getRelationTypePrimaryColumn(repository);
  const fieldWithType = ObjectTyped.entries(getFieldWithType(repository))
    .filter(
      ([key]) => key !== repository.metadata.primaryColumns[0].propertyName
    )
    .reduce(
      (acum, [key, type]) => ({
        ...acum,
        [key]: type,
      }),
      {} as FieldWithType<E>
    );
  const typeName = camelToKebab(getEntityName(repository.target));
  const postShape: PostShape<E> = {
    type: zodTypeSchema(typeName),
    attributes: zodAttributesSchema(fieldWithType),
    relationships: zodRelationshipsSchema(
      relationArrayProps,
      relationPopsName,
      primaryColumnType
    ).optional(),
  };

  return z
    .object({
      data: z.object(postShape).strict(),
    })
    .strict();
};

export const zodInputPatchSchema = <E extends Entity>(
  repository: Repository<E>
): ZodInputPatchSchema<E> => {
  const relationArrayProps = getRelationTypeArray(repository);
  const relationPopsName = getRelationTypeName(repository);
  const primaryColumnType = getRelationTypePrimaryColumn(repository);
  const primaryType = getTypePrimaryColumn(repository);

  const fieldWithType = ObjectTyped.entries(getFieldWithType(repository))
    .filter(
      ([key]) => key !== repository.metadata.primaryColumns[0].propertyName
    )
    .reduce(
      (acum, [key, type]) => ({
        ...acum,
        [key]: type,
      }),
      {} as FieldWithType<E>
    );
  const typeName = camelToKebab(getEntityName(repository.target));
  const postShape: PatchShape<E> = {
    id: zodIdSchema(primaryType),
    type: zodTypeSchema(typeName),
    attributes: zodAttributesSchema(fieldWithType),
    relationships: zodPatchRelationshipsSchema(
      relationArrayProps,
      relationPopsName,
      primaryColumnType
    ).optional(),
  };

  return z
    .object({
      data: z.object(postShape).strict(),
    })
    .strict();
};

export const zodInputPostRelationshipSchema: ZodInputPostRelationshipSchema = z
  .object({
    data: postRelationshipSchema,
  })
  .strict();

export const zodInputPatchRelationshipSchema: ZodInputPatchRelationshipSchema =
  z
    .object({
      data: patchRelationshipSchema,
    })
    .strict();
