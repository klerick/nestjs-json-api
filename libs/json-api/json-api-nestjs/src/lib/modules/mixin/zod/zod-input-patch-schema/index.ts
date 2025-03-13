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

import { EntityParamMapService } from '../../service';
import { TypeForId } from '../../../../types';

type ZodPatchPatchShape<E extends object, IdKey extends string> = {
  id: ZodId;
  type: ZodType<string>;
  attributes: ZodOptional<ZodAttributes<E, IdKey, true>>;
  relationships: ZodOptional<ZodRelationships<E, IdKey, true>>;
};

type ZodInputPatchSchema<E extends object, IdKey extends string> = ZodObject<
  ZodPatchPatchShape<E, IdKey>,
  'strict'
>;

type ZodInputPatchDataShape<E extends object, IdKey extends string> = {
  data: ZodInputPatchSchema<E, IdKey>;
};

function getShape<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
): ZodInputPatchSchema<E, IdKey> {
  const shape = {
    id: zodId(
      entityParamMapService.entityParaMap.primaryColumnType as TypeForId
    ),
    type: zodType(entityParamMapService.entityParaMap.typeName),
    attributes: zodAttributes(entityParamMapService, true).optional(),
    relationships: zodRelationships(entityParamMapService, true).optional(),
  };

  return z.object(shape).strict();
}

export function zodPatch<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
): ZodPatch<E, IdKey> {
  const shape = getShape(entityParamMapService);

  return z
    .object({
      data: shape,
    })
    .strict();
}

export type ZodPatch<E extends object, IdKey extends string> = ZodObject<
  ZodInputPatchDataShape<E, IdKey>,
  'strict'
>;
export type PatchData<E extends object, IdKey extends string> = z.infer<
  ZodPatch<E, IdKey>
>['data'];
