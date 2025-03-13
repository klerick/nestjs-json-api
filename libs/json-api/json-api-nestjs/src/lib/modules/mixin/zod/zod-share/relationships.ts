import { z } from 'zod';
import { ObjectTyped } from '@klerick/json-api-nestjs-shared';

import {
  EntityParam,
  TypeForId,
  RelationProperty,
  TypeField,
} from '../../../../types';

import { zodRelData } from './rel-data';
import { nonEmptyObject, setOptionalOrNot } from '../zod-utils';
import { EntityParamMapService } from '../../service';

function getZodResultData<
  TypeName extends string,
  Type extends TypeForId,
  IsNull extends true | false = false,
  IsPatch extends true | false = false
>(typeName: TypeName, primaryType: Type, isNull: IsNull, isPatch: IsPatch) {
  const dataScheme = z.object({
    data: setOptionalOrNot(zodRelData(typeName, primaryType), isNull, isPatch),
  });
  return setOptionalOrNot(dataScheme.refine(nonEmptyObject()), isNull, isPatch);
}

function getZodResultDataArray<TypeName extends string, Type extends TypeForId>(
  typeName: TypeName,
  primaryType: Type
) {
  return z
    .object({
      data: zodRelData(typeName, primaryType).array(),
    })
    .optional();
}

type IsArrayRelation<
  E extends object,
  R extends keyof RelationProperty<E>
> = RelationProperty<E>[R]['isArray'];

type IsNullableRelation<
  E extends object,
  R extends keyof RelationProperty<E>
> = RelationProperty<E>[R]['nullable'];

type EntityParamForRel<
  E extends object,
  R extends keyof RelationProperty<E>,
  IdKey extends string
> = EntityParam<RelationProperty<E>[R]['entityClass'], IdKey>;

type RelPrimaryColumnType<IdKey> = IdKey extends TypeForId
  ? IdKey
  : TypeField.string;

type ZodResultDataArray<
  E extends object,
  R extends keyof RelationProperty<E>,
  IdKey extends string
> = ReturnType<
  typeof getZodResultDataArray<
    EntityParamForRel<E, R, IdKey>['typeName'],
    RelPrimaryColumnType<EntityParamForRel<E, R, IdKey>['primaryColumnType']>
  >
>;

type ZodResultData<
  E extends object,
  R extends keyof RelationProperty<E>,
  IdKey extends string,
  IsPatch extends boolean
> = ReturnType<
  typeof getZodResultData<
    EntityParamForRel<E, R, IdKey>['typeName'],
    RelPrimaryColumnType<EntityParamForRel<E, R, IdKey>['primaryColumnType']>,
    IsNullableRelation<E, R>,
    IsPatch
  >
>;

type ZodData<
  E extends object,
  R extends keyof RelationProperty<E>,
  IdKey extends string,
  IsPatch extends boolean,
  IsArray extends boolean
> = IsArray extends true
  ? ZodResultDataArray<E, R, IdKey>
  : ZodResultData<E, R, IdKey, IsPatch>;

export type ZodRelationShape<
  E extends object,
  IdKey extends string,
  IsPatch extends true | false = false
> = {
  [K in keyof RelationProperty<E>]: ZodData<
    E,
    K,
    IdKey,
    IsPatch,
    IsArrayRelation<E, K>
  >;
};

export function zodRelationships<
  E extends object,
  IdKey extends string,
  IsPatch extends true | false = false
>(entityParamMapService: EntityParamMapService<E, IdKey>, isPatch: IsPatch) {
  const shape = ObjectTyped.entries(
    entityParamMapService.entityParaMap.relationProperty
  ).reduce((acum, [key, val]) => {
    const relEntityParaMap = entityParamMapService.getParamMap(
      val.entityClass as any
    ) as EntityParamForRel<E, typeof key, IdKey>;

    if (val.isArray) {
      acum[key] = getZodResultDataArray(
        relEntityParaMap.typeName,
        relEntityParaMap.primaryColumnType as TypeForId
      ) as ZodData<E, typeof key, IdKey, IsPatch, typeof val.isArray>;
    } else {
      acum[key] = getZodResultData(
        relEntityParaMap.typeName,
        relEntityParaMap.primaryColumnType as TypeForId,
        val.nullable,
        isPatch
      ) as ZodData<E, typeof key, IdKey, IsPatch, typeof val.isArray>;
    }
    return acum;
  }, {} as ZodRelationShape<E, IdKey, IsPatch>);

  return z.object(shape).strict().refine(nonEmptyObject());
}

export type ZodRelationships<
  E extends object,
  IdKey extends string,
  S extends true | false = false
> = ReturnType<typeof zodRelationships<E, IdKey, S>>;
export type Relationships<
  E extends object,
  IdKey extends string,
  S extends true | false = false
> = z.infer<ZodRelationships<E, IdKey, S>>;
