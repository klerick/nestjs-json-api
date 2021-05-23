import { EntityMetadata } from 'typeorm';

import { checkEntityFieldMetadata } from '..';
import {
  ValidationError,
  QueryParams,
  QueryField,
} from '../../../types';


export async function checkQuerySortParam(
  queryParams: QueryParams,
  entityMetadata: EntityMetadata,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  (Object.entries(queryParams[QueryField.sort] || {})).forEach(([name, value]) => {
    errors.push(
      ...checkEntityFieldMetadata(name, queryParams, entityMetadata, QueryField.sort)
    );
  });

  return errors;
}


