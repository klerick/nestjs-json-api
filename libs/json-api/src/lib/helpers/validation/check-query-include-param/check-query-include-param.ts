import { EntityMetadata } from 'typeorm';
import { paramCase } from 'param-case';

import {
  ValidationError,
  QueryParams,
  QueryField,
} from '../../../types';


export async function checkQueryIncludeParam(
  queryParams: QueryParams,
  entityMetadata: EntityMetadata,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  (queryParams[QueryField.include] || []).forEach(relationName => {
    const relation = entityMetadata.relations.find(relation => {
      return relation.propertyPath === relationName;
    });

    if (!relation) {
      errors.push({
        detail: `Relation '${paramCase(relationName)}' does not exist`,
        source: {
          parameter: QueryField.include,
        },
      });
    }
  });

  return errors;
}
