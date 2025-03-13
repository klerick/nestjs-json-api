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

import {
  ZOD_INPUT_QUERY_SCHEMA,
  ZOD_QUERY_SCHEMA,
  ZOD_POST_SCHEMA,
  ZOD_PATCH_SCHEMA,
  ZOD_POST_RELATIONSHIP_SCHEMA,
  ZOD_PATCH_RELATIONSHIP_SCHEMA,
} from '../../../constants';

import { EntityParamMapService } from '../service';
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
    inject: [EntityParamMapService],
    useFactory: (entityParamMapService: EntityParamMapService<E, IdKey>) => {
      return zodPost(entityParamMapService);
    },
  };
}

export function ZodPatchSchema<
  E extends object,
  IdKey extends string = 'id'
>(): FactoryProvider<ZodPatch<E, IdKey>> {
  return {
    provide: ZOD_PATCH_SCHEMA,
    inject: [EntityParamMapService],
    useFactory: (entityParamMapService: EntityParamMapService<E, IdKey>) => {
      return zodPatch(entityParamMapService);
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
