import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ObjectTyped } from '@klerick/json-api-nestjs-shared';

import { ValidateQueryError } from '../../../../types';
import { Query } from '../../zod';

export class QueryFiledInIncludePipe<E extends object>
  implements PipeTransform<Query<E, 'id'>, Query<E, 'id'>>
{
  transform(value: Query<E, 'id'>): Query<E, 'id'> {
    const errors: ValidateQueryError[] = [];

    const { fields, include, sort, filter } = value;
    const includeSet = new Set<string>();

    if (include) {
      include.reduce((acum, item) => acum.add(item), includeSet);
    }

    if (filter) {
      const { relation } = filter;
      if (relation) {
        const filterRelationFields = ObjectTyped.keys(relation);
        const filterFieldsErrors = filterRelationFields
          .filter((i) => !includeSet.has(i.toString()))
          .map<ValidateQueryError>((i) => ({
            code: 'invalid_intersection_types',
            message: `Add '${i.toString()}' to query param 'include'`,
            path: ['filter', 'relation', i.toString()],
          }));

        errors.push(...filterFieldsErrors);
      }
    }

    if (fields) {
      const { target: targetResourceFields, ...relationFields } = fields;
      const selectRelationFields = ObjectTyped.keys(relationFields);
      const fieldsErrors = selectRelationFields
        .filter((i) => !includeSet.has(i.toString()))
        .map<ValidateQueryError>((i) => ({
          code: 'invalid_intersection_types',
          message: `Add '${i.toString()}' to query param 'include'`,
          path: ['fields'],
        }));

      errors.push(...fieldsErrors);
    }

    if (sort) {
      const { target: targetResourceSorts, ...relationSorts } = sort;
      const selectRelationFields = ObjectTyped.keys(relationSorts);
      const fieldsErrors = selectRelationFields
        .filter((i) => !includeSet.has(i.toString()))
        .map<ValidateQueryError>((i) => ({
          code: 'invalid_intersection_types',
          message: `Add '${i.toString()}' to query param 'include'`,
          path: ['sort'],
        }));

      errors.push(...fieldsErrors);
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return value;
  }
}
