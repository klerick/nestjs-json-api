import { ExecutionContext, HttpException } from '@nestjs/common';

import { PostgresErrors, QueryField } from '../../../types';


export function preparePostgresError(
  context: ExecutionContext,
  error: any,
): HttpException {
  const request = context.switchToHttp().getRequest();
  const errors = [];

  switch (error.code) {
    case PostgresErrors.InvalidTimestamp:
    case PostgresErrors.InvalidType: {
      Object.entries(request.query.filter || {})
        .forEach(([key, value]) => {
          const test = typeof value === 'object' ? Object.values(value).pop() : value;
          if (error.message.includes(`"${test}"`)) {
            errors.push({
              detail: `Filter param '${key}' has invalid type`,
              source: {
                parameter: QueryField.filter,
              },
            });
          }
        });
      break;
    }

    case PostgresErrors.DuplicateKey: {
      const matches = error.detail.match(/(?<=\().+?(?=\))/gm);
      errors.push({
        source: {
          pointer: `/data/attributes/${matches[0]}`
        },
        detail: `Duplicate value '${matches[1]}' in the '${matches[0]}' attribute`
      });
      break;
    }

    case PostgresErrors.KeyConstraint: {
      errors.push({
        detail: 'You must clean entity relationships before this operation'
      });
      break;
    }

    case PostgresErrors.OperatorDoesNotExist: {
      errors.push({
        detail: 'Filter params contain invalid operator',
        source: {
          parameter: QueryField.filter,
        },
      });
      break;
    }
  }

  const preparedError = new HttpException({ errors }, 409);
  preparedError.stack = error.stack;
  return preparedError;
}
