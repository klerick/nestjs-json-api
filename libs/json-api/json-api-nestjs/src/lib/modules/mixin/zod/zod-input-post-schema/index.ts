import { z, ZodObject, ZodOptional } from 'zod';

import {
  TypeForId,
  ExtractJsonApiReadOnlyKeys,
  ExtractJsonApiImmutableKeys,
  JsonApiReadOnlyField,
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
} from '../zod-share';
import { EntityParamMapService } from '../../service';


type ZodInputPostShape<E extends object, IdKey extends string> = {
  id: ZodOptional<ZodId>;
  type: ZodType<string>;
  attributes: ZodAttributes<PostEntity<E>, IdKey>;
  relationships: ZodOptional<ZodRelationships<E, IdKey>>;
};

type ZodInputPostSchema<E extends object, IdKey extends string> = ZodObject<
  ZodInputPostShape<E, IdKey>,
  z.core.$strict
>;

type ZodInputPostDataShape<E extends object, IdKey extends string> = {
  data: ZodInputPostSchema<E, IdKey>;
};

function getShape<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>,
  readOnlyProps: ExtractJsonApiReadOnlyKeys<E>[] = [],
  immutableProps: ExtractJsonApiImmutableKeys<E>[] = []
): ZodInputPostSchema<E, IdKey> {
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
    ) as unknown as ZodAttributes<PostEntity<E>, IdKey>,
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
  });
}

export type ZodPost<E extends object, IdKey extends string> = ZodObject<
  ZodInputPostDataShape<E, IdKey>,
  z.core.$strict
>;
export type Post<E extends object, IdKey extends string> = z.infer<
  ZodPost<E, IdKey>
>;

type PostEntity<E> =
  E extends object
    ? Omit<E, ExtractJsonApiReadOnlyKeys<E> | ExtractJsonApiImmutableKeys<E>> &
      Partial<Pick<E, ExtractJsonApiImmutableKeys<E>>>
    : never;

export type PostData<E extends object, IdKey extends string> = Post<
  E,
  IdKey
>['data'];

class Users {
  id!: number;
  login!: string;
}
type IUsers = Users;

class Test {
  id!: number;
  name!: string;
  updatedAt: Date & JsonApiReadOnlyField = new Date();
  createdBy!: IUsers;
}

type a = Post<PostEntity<Test>, 'id'>['data'];
type a1 = Post<Test, 'id'>['data'];
