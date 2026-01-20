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
  Id,
  Attributes,
  Relationships,
} from '../zod-share';

import { EntityParamMapService } from '../../service';
import { TypeForId, ExtractJsonApiReadOnlyKeys, ExtractJsonApiImmutableKeys } from '../../../../types';

type ZodPatchPatchShape<E extends object, IdKey extends string> = {
  id: ZodId;
  type: ZodType<string>;
  attributes: ZodOptional<ZodAttributes<E, IdKey, true>>;
  relationships: ZodOptional<ZodRelationships<E, IdKey, true>>;
};

type ZodInputPatchSchema<E extends object, IdKey extends string> = ZodObject<
  ZodPatchPatchShape<E, IdKey>,
  z.core.$strict
>;

type ZodInputPatchDataShape<E extends object, IdKey extends string> = {
  data: ZodInputPatchSchema<E, IdKey>;
};

function getShape<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>,
  readOnlyProps: ExtractJsonApiReadOnlyKeys<E>[] = [],
  immutableProps: ExtractJsonApiImmutableKeys<E>[] = []
) {
  const shape = {
    id: zodId(
      entityParamMapService.entityParaMap.primaryColumnType as TypeForId
    ),
    type: zodType(entityParamMapService.entityParaMap.typeName),
    attributes: zodAttributes(entityParamMapService, true, readOnlyProps, immutableProps).optional(),
    relationships: zodRelationships(entityParamMapService, true).optional(),
  };

  return z.strictObject(shape);
}

export function zodPatch<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>,
  readOnlyProps: ExtractJsonApiReadOnlyKeys<E>[] = [],
  immutableProps: ExtractJsonApiImmutableKeys<E>[] = []
): ZodPatch<E, IdKey> {
  const shape = getShape(entityParamMapService, readOnlyProps, immutableProps);

  return z.strictObject({
    data: shape,
  });
}

export type ZodPatch<E extends object, IdKey extends string> = ZodObject<
  ZodInputPatchDataShape<E, IdKey>,
  z.core.$strict
>;
export type PatchDataRaw<E extends object, IdKey extends string> = z.infer<
  ZodPatch<E, IdKey>
>['data'];

// Type for Patch attributes: exclude ReadOnly and Immutable, all fields optional
type PatchAttributesType<E extends object, IdKey extends string> = Partial<
  Omit<
    Attributes<E, IdKey>,
    ExtractJsonApiReadOnlyKeys<E> | ExtractJsonApiImmutableKeys<E>
  >
>;

export type PatchData<E extends object, IdKey extends string> = {
  id: Id;
  type: string;
  attributes?: PatchAttributesType<E, IdKey>;
  relationships?: Relationships<E, IdKey, true>;
};

export type Patch<E extends object, IdKey extends string> = {
  data: PatchData<E, IdKey>;
};
