import { QueryField } from '@klerick/json-api-nestjs-shared';
import { z } from 'zod';
import { RelationTree, ResultGetField } from '../../types';
import { ObjectLiteral } from '../../../../types';

import { zodFieldsInputQuery } from './fields';
import { zodFilterInputQuery } from './filter';
import { zodIncludeInputQuery } from './include';
import { zodSortInputQuery } from './sort';
import { zodPageInputQuery } from '../zod-share';

export function zodInputQuery<E extends ObjectLiteral>(
  entityFieldsStructure: ResultGetField<E>,
  entityRelationStructure: RelationTree<E>
) {
  return z
    .object({
      [QueryField.fields]: zodFieldsInputQuery<E>(
        entityFieldsStructure.relations
      ),
      [QueryField.filter]: zodFilterInputQuery(
        entityFieldsStructure.field,
        entityRelationStructure
      ),
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

export type ZodInputQuery<E extends ObjectLiteral> = ReturnType<
  typeof zodInputQuery<E>
>;
export type InputQuery<E extends ObjectLiteral> = z.infer<ZodInputQuery<E>>;
