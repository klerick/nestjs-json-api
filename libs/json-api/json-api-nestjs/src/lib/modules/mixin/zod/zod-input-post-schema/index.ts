import { z, ZodObject, ZodOptional } from 'zod';

import { TypeForId } from '../../../../types';
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
import { EntityParamMapService } from '../../service';

type ZodInputPostShape<E extends object, IdKey extends string> = {
  id: ZodOptional<ZodId>;
  type: ZodType<string>;
  attributes: ZodAttributes<E, IdKey>;
  relationships: ZodOptional<ZodRelationships<E, IdKey>>;
};

type ZodInputPostSchema<E extends object, IdKey extends string> = ZodObject<
  ZodInputPostShape<E, IdKey>,
  'strict'
>;

type ZodInputPostDataShape<E extends object, IdKey extends string> = {
  data: ZodInputPostSchema<E, IdKey>;
};

function getShape<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
): ZodInputPostSchema<E, IdKey> {
  const shape = {
    id: zodId(
      entityParamMapService.entityParaMap.primaryColumnType as TypeForId
    ).optional(),
    type: zodType(entityParamMapService.entityParaMap.typeName),
    attributes: zodAttributes(entityParamMapService, false),
    relationships: zodRelationships(entityParamMapService, false).optional(),
  };

  return z.object(shape).strict();
}

function zodDataShape<E extends object, IdKey extends string>(
  shape: ZodInputPostSchema<E, IdKey>
): ZodPost<E, IdKey> {
  return z
    .object({
      data: shape,
    })
    .strict();
}

export function zodPost<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
): ZodPost<E, IdKey> {
  const shape = getShape(entityParamMapService);

  return zodDataShape(shape);
}

export type ZodPost<E extends object, IdKey extends string> = ZodObject<
  ZodInputPostDataShape<E, IdKey>,
  'strict'
>;
export type Post<E extends object, IdKey extends string> = z.infer<
  ZodPost<E, IdKey>
>;
export type PostData<E extends object, IdKey extends string> = Post<
  E,
  IdKey
>['data'];
