import { z } from 'zod';
import { uniqueArray } from '../zod-utils';
import { EntityParamMapService } from '../../service';
import { NonEmptyStringTuple } from '../../../../types';

export function zodIncludeQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  const relationProps: NonEmptyStringTuple<
    typeof entityParamMapService.entityParaMap.relations
  > = entityParamMapService.entityParaMap.relations as any;

  return z
    .enum(relationProps)
    .array()
    .nonempty()
    .refine(uniqueArray(), {
      message: 'Include should have unique relation',
    })
    .nullable();
}

export type ZodIncludeQuery<
  E extends object,
  IdKey extends string
> = ReturnType<typeof zodIncludeQuery<E, IdKey>>;
export type IncludeQuery<E extends object, IdKey extends string> = z.infer<
  ZodIncludeQuery<E, IdKey>
>;
