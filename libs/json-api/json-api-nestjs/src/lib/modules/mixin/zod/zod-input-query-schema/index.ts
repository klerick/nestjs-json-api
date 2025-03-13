import { QueryField } from '@klerick/json-api-nestjs-shared';
import { z } from 'zod';

import { EntityParamMapService } from '../../service';
import { zodFieldsInputQuery } from './fields';
import { zodFilterInputQuery } from './filter';
import { zodIncludeInputQuery } from './include';
import { zodSortInputQuery } from './sort';
import { zodPageInputQuery } from '../zod-share';

export function zodInputQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  return z
    .object({
      [QueryField.fields]: zodFieldsInputQuery<E, IdKey>(entityParamMapService),
      [QueryField.filter]: zodFilterInputQuery<E, IdKey>(entityParamMapService),
      [QueryField.include]: zodIncludeInputQuery(),
      [QueryField.sort]: zodSortInputQuery(),
      [QueryField.page]: zodPageInputQuery(),
    })
    .strict(
      `Query object should contain only allow params: "${Object.keys(
        QueryField
      ).join('"."')}"`
    );
}

export type ZodInputQuery<E extends object, IdKey extends string> = ReturnType<
  typeof zodInputQuery<E, IdKey>
>;
export type InputQuery<E extends object, IdKey extends string> = z.infer<
  ZodInputQuery<E, IdKey>
>;
