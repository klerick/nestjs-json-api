import { DataSource, Repository } from 'typeorm';
import { Entity, ModuleOptions } from '../types';
import { FactoryProvider, ValueProvider } from '@nestjs/common';
import {
  ZodInputQuerySchema,
  zodInputQuerySchema,
  ZodQuerySchema,
  zodQuerySchema,
  zodInputPostSchema,
  ZodInputPostSchema,
  zodInputPatchSchema,
  ZodInputPatchSchema,
  ZodInputPostRelationshipSchema as ZodInputPostRelationshipSchemaType,
  ZodInputPatchRelationshipSchema as ZodInputPatchRelationshipSchemaType,
  zodInputPostRelationshipSchema,
  zodInputPatchRelationshipSchema,
} from '../helper/zod';
import {
  CURRENT_DATA_SOURCE_TOKEN,
  ZOD_INPUT_QUERY_SCHEMA,
  ZOD_POST_SCHEMA,
  ZOD_PATCH_SCHEMA,
  ZOD_POST_RELATIONSHIP_SCHEMA,
  ZOD_PATCH_RELATIONSHIP_SCHEMA,
  ZOD_QUERY_SCHEMA,
} from '../constants';

import { EntityTarget } from 'typeorm/common/EntityTarget';

export function ZodInputQuerySchema<E extends Entity>(
  entity: E
): FactoryProvider<ZodInputQuerySchema<E>> {
  return {
    provide: ZOD_INPUT_QUERY_SCHEMA,
    inject: [
      {
        token: CURRENT_DATA_SOURCE_TOKEN,
        optional: false,
      },
    ],
    useFactory: (dataSource: DataSource) =>
      zodInputQuerySchema<E>(
        dataSource.getRepository<E>(entity as EntityTarget<E>)
      ),
  };
}

export function ZodQuerySchema<E extends Entity>(
  entity: E
): FactoryProvider<ZodQuerySchema<E>> {
  return {
    provide: ZOD_QUERY_SCHEMA,
    inject: [
      {
        token: CURRENT_DATA_SOURCE_TOKEN,
        optional: false,
      },
    ],
    useFactory: (dataSource: DataSource) =>
      zodQuerySchema<E>(dataSource.getRepository<E>(entity as EntityTarget<E>)),
  };
}

export function ZodInputPostSchema<E extends Entity>(
  entity: E
): FactoryProvider<ZodInputPostSchema<E>> {
  return {
    provide: ZOD_POST_SCHEMA,
    inject: [
      {
        token: CURRENT_DATA_SOURCE_TOKEN,
        optional: false,
      },
    ],
    useFactory: (dataSource: DataSource) =>
      zodInputPostSchema<E>(
        dataSource.getRepository<E>(entity as EntityTarget<E>)
      ),
  };
}

export function ZodInputPatchSchema<E extends Entity>(
  entity: E
): FactoryProvider<ZodInputPatchSchema<E>> {
  return {
    provide: ZOD_PATCH_SCHEMA,
    inject: [
      {
        token: CURRENT_DATA_SOURCE_TOKEN,
        optional: false,
      },
    ],
    useFactory: (dataSource: DataSource) =>
      zodInputPatchSchema<E>(
        dataSource.getRepository<E>(entity as EntityTarget<E>)
      ),
  };
}

export const ZodInputPostRelationshipSchema: ValueProvider<ZodInputPostRelationshipSchemaType> =
  {
    provide: ZOD_POST_RELATIONSHIP_SCHEMA,
    useValue: zodInputPostRelationshipSchema,
  };

export const ZodInputPatchRelationshipSchema: ValueProvider<ZodInputPatchRelationshipSchemaType> =
  {
    provide: ZOD_PATCH_RELATIONSHIP_SCHEMA,
    useValue: zodInputPatchRelationshipSchema,
  };
