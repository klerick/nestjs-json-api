import AjvCall from 'ajv';

import { QueryParams, ValidationError } from '../../../types';
import * as querySchema from '../../../schema/query.json';

const ajv = new AjvCall({ allErrors: true });


export async function checkQueryParamsSchema(query: QueryParams): Promise<ValidationError[]> {
  const validateFunction = ajv.compile(querySchema);
  const validate = validateFunction(query);
  const errors: ValidationError[] = [];

  if (!validate) {
    validateFunction.errors.forEach(error => {
      const parameterParts = error.instancePath.split('/').filter(value => value !== '');
      switch (error.keyword) {
        case 'uniqueItems':
          errors.push({
            source: { parameter: parameterParts[0] },
            detail: `Query parameter '${parameterParts.join('.')}' values must be unique`,
          });
          break;
        case 'minProperties':
        case 'minItems':
          errors.push({
            source: { parameter: parameterParts[0] },
            detail: `Query parameter '${parameterParts.join('.')}' must not have less than ${error.params.limit} items`,
          });
          break;
        case 'type':
          errors.push({
            source: { parameter: parameterParts[0] },
            detail: `Query parameter '${parameterParts.join('.')}' must be of '${error.params.type}' type`,
          });
          break;
        case 'minimum':
          errors.push({
            source: { parameter: parameterParts[0] },
            detail: `Query parameter '${parameterParts.join('.')}' must be greater or equal to ${error.params.limit}`,
          });
          break;
        default:
          errors.push({
            source: { parameter: parameterParts[0] },
            detail: error.message,
          });
      }
    });
  }

  return errors;
}
