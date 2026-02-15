import { EntityClass } from '@klerick/json-api-nestjs-shared';

import { ExtractJsonApiReadOnlyKeys, ExtractJsonApiImmutableKeys } from '../../../types';
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
  zodMetaExtractor,
  ZodMetaExtractor,
} from '../zod';

import {
  ZOD_INPUT_QUERY_SCHEMA,
  ZOD_QUERY_SCHEMA,
  ZOD_POST_SCHEMA,
  ZOD_PATCH_SCHEMA,
  ZOD_POST_RELATIONSHIP_SCHEMA,
  ZOD_PATCH_RELATIONSHIP_SCHEMA,
  ZOD_META_SCHEMA,
  CURRENT_ENTITY,
} from '../../../constants';

import { EntityParamMapService } from '../service';
import { getJsonApiReadOnlyFields, getJsonApiImmutableFields } from '../decorators';
import { FactoryProvider, ValueProvider } from '@nestjs/common';

export function ZodInputQuerySchema<
  E extends object,
  IdKey extends string = 'id'
>(): FactoryProvider<ZodInputQuery<E, IdKey>> {
  return {
    provide: ZOD_INPUT_QUERY_SCHEMA,
    inject: [EntityParamMapService],
    useFactory: (entityParamMapService: EntityParamMapService<E, IdKey>) => {
      return zodInputQuery(entityParamMapService);
    },
  };
}
export function ZodQuerySchema<
  E extends object,
  IdKey extends string = 'id'
>(): FactoryProvider<ZodQuery<E, IdKey>> {
  return {
    provide: ZOD_QUERY_SCHEMA,
    inject: [EntityParamMapService],
    useFactory: (entityParamMapService: EntityParamMapService<E, IdKey>) => {
      return zodQuery(entityParamMapService);
    },
  };
}
export function ZodPostSchema<
  E extends object,
  IdKey extends string = 'id'
>(): FactoryProvider<ZodPost<E, IdKey>> {
  return {
    provide: ZOD_POST_SCHEMA,
    inject: [EntityParamMapService, CURRENT_ENTITY],
    useFactory: (
      entityParamMapService: EntityParamMapService<E, IdKey>,
      entity: EntityClass<E>
    ) => {
      const readOnlyProps = getJsonApiReadOnlyFields(entity) as ExtractJsonApiReadOnlyKeys<E>[];
      const immutableProps = getJsonApiImmutableFields(entity) as ExtractJsonApiImmutableKeys<E>[];
      return zodPost(entityParamMapService, readOnlyProps, immutableProps);
    },
  };
}

export function ZodPatchSchema<
  E extends object,
  IdKey extends string = 'id'
>(): FactoryProvider<ZodPatch<E, IdKey>> {
  return {
    provide: ZOD_PATCH_SCHEMA,
    inject: [EntityParamMapService, CURRENT_ENTITY],
    useFactory: (
      entityParamMapService: EntityParamMapService<E, IdKey>,
      entity: EntityClass<E>
    ) => {
      const readOnlyProps = getJsonApiReadOnlyFields(entity) as ExtractJsonApiReadOnlyKeys<E>[];
      const immutableProps = getJsonApiImmutableFields(entity) as ExtractJsonApiImmutableKeys<E>[];
      return zodPatch(entityParamMapService, readOnlyProps, immutableProps);
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

export const ZodMetaSchema: ValueProvider<ZodMetaExtractor> = {
  provide: ZOD_META_SCHEMA,
  useValue: zodMetaExtractor,
};
