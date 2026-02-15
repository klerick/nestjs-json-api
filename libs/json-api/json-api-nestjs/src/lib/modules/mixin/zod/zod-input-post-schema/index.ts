import { z, ZodObject, ZodOptional } from 'zod';

import {
  TypeForId,
  ExtractJsonApiReadOnlyKeys,
  ExtractJsonApiImmutableKeys,
} from '../../../../types';
import {
  ZodId,
  zodId,
  ZodType,
  zodType,
  ZodAttributes,
  zodAttributes,
  ZodRelationships,
  zodRelationships,
  Id,
  Attributes,
  Relationships,
  zodMeta,
  ZodMeta,
} from '../zod-share';
import { EntityParamMapService } from '../../service';


type ZodInputPostShape<E extends object, IdKey extends string> = {
  id: ZodOptional<ZodId>;
  type: ZodType<string>;
  attributes: ZodAttributes<E, IdKey>;
  relationships: ZodOptional<ZodRelationships<E, IdKey>>;
};

type ZodInputPostSchema<E extends object, IdKey extends string> = ZodObject<
  ZodInputPostShape<E, IdKey>,
  z.core.$strict
>;

type ZodInputPostDataShape<E extends object, IdKey extends string> = {
  data: ZodInputPostSchema<E, IdKey>;
  meta: ZodMeta;
};

function getShape<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>,
  readOnlyProps: ExtractJsonApiReadOnlyKeys<E>[] = [],
  immutableProps: ExtractJsonApiImmutableKeys<E>[] = []
) {
  const shape = {
    id: zodId(
      entityParamMapService.entityParaMap.primaryColumnType as TypeForId
    ).optional(),
    type: zodType(entityParamMapService.entityParaMap.typeName),
    attributes: zodAttributes(
      entityParamMapService,
      false,
      readOnlyProps,
      immutableProps
    ),
    relationships: zodRelationships(entityParamMapService, false).optional(),
  };

  return z.strictObject(shape);
}

export function zodPost<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>,
  readOnlyProps: ExtractJsonApiReadOnlyKeys<E>[] = [],
  immutableProps: ExtractJsonApiImmutableKeys<E>[] = []
): ZodPost<E, IdKey> {
  return z.strictObject({
    data: getShape(entityParamMapService, readOnlyProps, immutableProps),
    meta: zodMeta,
  });
}

export type ZodPost<E extends object, IdKey extends string> = ZodObject<
  ZodInputPostDataShape<E, IdKey>,
  z.core.$strict
>;

export type PostDataRaw<E extends object, IdKey extends string> = Post<
  E,
  IdKey
>['data'];

// Type for Post attributes: exclude ReadOnly, make Immutable optional
type PostAttributesType<E extends object, IdKey extends string> =
  Omit<
    Attributes<E, IdKey, false>,
    ExtractJsonApiReadOnlyKeys<E> | ExtractJsonApiImmutableKeys<E>
  > &
  Partial<
    Pick<
      Attributes<E, IdKey, false>,
      Extract<ExtractJsonApiImmutableKeys<E>, keyof Attributes<E, IdKey, false>>
    >
  >;

export type PostData<E extends object, IdKey extends string> = {
  id?: Id;
  type: string;
  attributes: PostAttributesType<E, IdKey>;
  relationships?: Relationships<E, IdKey, false>;
};

export type Post<E extends object, IdKey extends string> = {
  data: PostData<E, IdKey>;
  meta?: Record<string, unknown>;
};
