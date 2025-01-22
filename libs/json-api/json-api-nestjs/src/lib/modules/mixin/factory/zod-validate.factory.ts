import { FactoryProvider, ValueProvider } from '@nestjs/common';

import {
  PARAMS_FOR_ZOD_SCHEMA,
  ZOD_INPUT_QUERY_SCHEMA,
  ZOD_QUERY_SCHEMA,
  ZOD_POST_SCHEMA,
  ZOD_PATCH_SCHEMA,
  ZOD_POST_RELATIONSHIP_SCHEMA,
  ZOD_PATCH_RELATIONSHIP_SCHEMA,
} from '../../../constants';

import {
  zodInputQuery,
  ZodInputQuery,
  zodQuery,
  ZodQuery,
  ZodPost,
  zodPost,
  zodPatch,
  ZodPatch,
  zodPostRelationship,
  ZodPostRelationship,
  zodPatchRelationship,
  ZodPatchRelationship,
} from '../zod';
import { ObjectLiteral } from '../../../types';
import { EntityProps, ZodParams } from '../types';

export function ZodInputQuerySchema<E extends ObjectLiteral>(): FactoryProvider<
  ZodInputQuery<E>
> {
  return {
    provide: ZOD_INPUT_QUERY_SCHEMA,
    inject: [
      {
        token: PARAMS_FOR_ZOD_SCHEMA,
        optional: false,
      },
    ],
    useFactory: (zodParams: ZodParams<E, EntityProps<E>>) => {
      const { entityFieldsStructure, entityRelationStructure } = zodParams;
      return zodInputQuery<E>(entityFieldsStructure, entityRelationStructure);
    },
  };
}

export function ZodQuerySchema<E extends ObjectLiteral>(): FactoryProvider<
  ZodQuery<E>
> {
  return {
    provide: ZOD_QUERY_SCHEMA,
    inject: [
      {
        token: PARAMS_FOR_ZOD_SCHEMA,
        optional: false,
      },
    ],
    useFactory: (zodParams: ZodParams<E, EntityProps<E>>) => {
      const {
        entityFieldsStructure,
        entityRelationStructure,
        propsType,
        propsArray,
      } = zodParams;
      return zodQuery<E>(
        entityFieldsStructure,
        entityRelationStructure,
        propsArray,
        propsType
      );
    },
  };
}

export function ZodPostSchema<
  E extends ObjectLiteral,
  I extends string
>(): FactoryProvider<ZodPost<E, I>> {
  return {
    provide: ZOD_POST_SCHEMA,
    inject: [
      {
        token: PARAMS_FOR_ZOD_SCHEMA,
        optional: false,
      },
    ],
    useFactory: (zodParams: ZodParams<E, EntityProps<E>, I>) => {
      const {
        typeId,
        typeName,
        fieldWithType,
        propsDb,
        primaryColumn,
        relationArrayProps,
        relationPopsName,
        primaryColumnType,
      } = zodParams;
      return zodPost<E, I>(
        typeId,
        typeName,
        fieldWithType,
        propsDb,
        primaryColumn,
        relationArrayProps,
        relationPopsName,
        primaryColumnType
      );
    },
  };
}

export function ZodPatchSchema<
  E extends ObjectLiteral,
  I extends string
>(): FactoryProvider<ZodPatch<E, I>> {
  return {
    provide: ZOD_PATCH_SCHEMA,
    inject: [
      {
        token: PARAMS_FOR_ZOD_SCHEMA,
        optional: false,
      },
    ],
    useFactory: (zodParams: ZodParams<E, EntityProps<E>, I>) => {
      const {
        typeId,
        typeName,
        fieldWithType,
        propsDb,
        primaryColumn,
        relationArrayProps,
        relationPopsName,
        primaryColumnType,
      } = zodParams;
      return zodPatch<E, I>(
        typeId,
        typeName,
        fieldWithType,
        propsDb,
        primaryColumn,
        relationArrayProps,
        relationPopsName,
        primaryColumnType
      );
    },
  };
}

export const ZodInputPostRelationshipSchema: ValueProvider<ZodPostRelationship> =
  {
    provide: ZOD_POST_RELATIONSHIP_SCHEMA,
    useValue: zodPostRelationship,
  };

export const ZodInputPatchRelationshipSchema: ValueProvider<ZodPatchRelationship> =
  {
    provide: ZOD_PATCH_RELATIONSHIP_SCHEMA,
    useValue: zodPatchRelationship,
  };
