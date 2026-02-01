import { QueryField } from '@klerick/json-api-nestjs-shared';
import { z } from 'zod';

import { EntityParamMapService } from '../../service';
import { zodFieldsInputQuery, zodFieldsInputQuerySwagger } from './fields';
import { zodFilterInputQuery, zodFilterInputQuerySwagger } from './filter';
import { zodIncludeInputQuery } from './include';
import { zodSortInputQuery } from './sort';
import { zodPageInputQuery } from '../zod-share';

export { zodFieldsInputQuery, zodFieldsInputQuerySwagger, zodFilterInputQuerySwagger };

export function zodInputQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  return z
    .strictObject({
      [QueryField.fields]: zodFieldsInputQuery<E, IdKey>(entityParamMapService),
      [QueryField.filter]: zodFilterInputQuery<E, IdKey>(entityParamMapService),
      [QueryField.include]: zodIncludeInputQuery(),
      [QueryField.sort]: zodSortInputQuery(),
      [QueryField.page]: zodPageInputQuery(),
    }, {
      error: (err) => err.code === 'unrecognized_keys' ? `Query object should contain only allow params: "${Object.keys(
        QueryField
      ).join('"."')}"` : err.message,
    });
}

export type ZodInputQuery<E extends object, IdKey extends string> = ReturnType<
  typeof zodInputQuery<E, IdKey>
>;
export type InputQuery<E extends object, IdKey extends string> = z.infer<
  ZodInputQuery<E, IdKey>
>;
