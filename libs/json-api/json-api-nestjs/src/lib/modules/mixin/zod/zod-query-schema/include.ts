import { z } from 'zod';
import type { ZodNullable, ZodArray, ZodEnum } from 'zod';
import { RelationKeys } from '@klerick/json-api-nestjs-shared';
import { uniqueArray } from '../zod-utils';
import { EntityParamMapService } from '../../service';
import { NonEmptyStringTuple } from '../../../../types';

type Relations<E extends object, IdKey extends string> = EntityParamMapService<
  E,
  IdKey
>['entityParaMap']['relations'];

type RelationsTuple<
  E extends object,
  IdKey extends string
> = NonEmptyStringTuple<Relations<E, IdKey>>;

// Zod transforms tuple to object { [k in T[number]]: k }
type EnumLike<T extends readonly string[]> = { [K in T[number]]: K };

export type ZodIncludeQuery<E extends object, IdKey extends string> = ZodNullable<
  ZodArray<ZodEnum<EnumLike<RelationsTuple<E, IdKey>>>>
>;

export function zodIncludeQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
): ZodIncludeQuery<E, IdKey> {
  const relationProps: RelationsTuple<E, IdKey> = entityParamMapService
    .entityParaMap.relations as RelationsTuple<E, IdKey>;

  return z
    .enum(relationProps)
    .array()
    .nonempty()
    .refine(uniqueArray(), {
      error: 'Include should have unique relation',
    })
    .nullable();
}

export type IncludeQuery<E extends object, IdKey extends string> = z.infer<
  ZodIncludeQuery<E, IdKey>
>;
