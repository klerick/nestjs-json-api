import { z, ZodObject } from 'zod';
import { QueryField } from '@klerick/json-api-nestjs-shared';

import { zodFieldsQuery, ZodFieldsQuery } from './fields';
import { zodFilterQuery, ZodFilterQuery } from './filter';
import { zodIncludeQuery, ZodIncludeQuery } from './include';
import { zodSortQuery, ZodSortQuery, SortQuery } from './sort';
import { zodPageInputQuery, ZodPageInputQuery } from '../zod-share';

import { EntityParamMapService } from '../../service';

export { SortQuery };

type Shape<E extends object, IdKey extends string> = {
  [QueryField.fields]: ZodFieldsQuery<E, IdKey>;
  [QueryField.filter]: ZodFilterQuery<E, IdKey>;
  [QueryField.include]: ZodIncludeQuery<E, IdKey>;
  [QueryField.sort]: ZodSortQuery<E, IdKey>;
  [QueryField.page]: ZodPageInputQuery;
};

function getShape<E extends object, IdKey extends string = 'id'>(
  entityParamMapService: EntityParamMapService<E, IdKey>
): Shape<E, IdKey> {
  return {
    [QueryField.fields]: zodFieldsQuery(entityParamMapService),
    [QueryField.filter]: zodFilterQuery(entityParamMapService),
    [QueryField.include]: zodIncludeQuery(entityParamMapService),
    [QueryField.sort]: zodSortQuery(entityParamMapService),
    [QueryField.page]: zodPageInputQuery(),
  };
}

function getZodResultSchema<E extends object, IdKey extends string>(
  shape: Shape<E, IdKey>
): ZodObject<Shape<E, IdKey>, z.core.$strict> {
  return z.strictObject(shape);
}
export function zodQuery<E extends object, IdKey extends string = 'id'>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  return getZodResultSchema(getShape(entityParamMapService));
}

export type ZodQuery<E extends object, IdKey extends string> = ZodObject<
  Shape<E, IdKey>,
  z.core.$strict
>;
export type Query<E extends object, IdKey extends string> = z.infer<
  ZodObject<Shape<E, IdKey>, z.core.$strict>
>;

function zodQueryOne<E extends object, IdKey extends string = 'id'>(
  entityParamMapService: EntityParamMapService<E, IdKey>
): ZodObject<
  Pick<Shape<E, IdKey>, QueryField.fields | QueryField.include>,
  z.core.$strict
> {
  return z
    .strictObject({
      [QueryField.fields]: zodFieldsQuery(entityParamMapService),
      [QueryField.include]: zodIncludeQuery(entityParamMapService),
    });
}

export type ZodQueryOne<E extends object, IdKey extends string> = ReturnType<
  typeof zodQueryOne<E, IdKey>
>;
export type QueryOne<E extends object, IdKey extends string> = z.infer<
  ZodQueryOne<E, IdKey>
>;
