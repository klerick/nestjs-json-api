import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, of, tap, throwError } from 'rxjs';

import { ResourceObject } from '../../../types-common';
import { QueryField } from '../../../types';

export enum PostgresErrors {
  OperatorDoesNotExist = '42883',
  InvalidTimestamp = '22007',
  InvalidType = '22P02',
  KeyConstraint = '23503',
  DuplicateKey = '23505',
  OutOfRange = '22003',
}

@Injectable()
export class ErrorInterceptors<T> implements NestInterceptor {
  private readonly logger = new Logger(ErrorInterceptors.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<ResourceObject<T>>
  ): Observable<ResourceObject<T>> {
    return next.handle().pipe(
      catchError((error) => {
        if (Object.values(PostgresErrors).includes(error.code)) {
          return throwError(() => this.preparePostgresError(context, error));
        }

        if (error instanceof HttpException) {
          return throwError(() => this.prepareHttpError(context, error));
        }
        const preparedError = new HttpException(
          {
            errors: [
              {
                detail: 'Internal server error',
              },
            ],
          },
          500
        );
        preparedError.stack = error.stack;
        return throwError(() => preparedError);
      }),
      tap({
        error: (error) => {
          if (
            (error instanceof HttpException && error.getStatus() >= 400) ||
            error.getStatus() < 500
          ) {
            this.logger.debug(error);
          } else {
            this.logger.error(error);
          }
        },
      })
    );
  }

  prepareHttpError(
    context: ExecutionContext,
    error: HttpException
  ): HttpException {
    const response = error.getResponse() as any;
    const status = error.getStatus();
    const errors = [];

    switch (typeof response.message) {
      case 'string':
        errors.push({ detail: response.message });
        break;

      case 'object':
        if (Array.isArray(response.message)) {
          errors.push(...response.message);
        } else {
          errors.push(response.message);
        }
        break;

      default:
        errors.push(response);
    }

    const preparedError = new HttpException({ status, errors }, status);
    preparedError.stack = error.stack;
    return preparedError;
  }

  preparePostgresError(context: ExecutionContext, error: any): HttpException {
    const request = context.switchToHttp().getRequest();
    const errors = [];
    let statusCode = 400;
    switch (error.code) {
      case PostgresErrors.InvalidTimestamp:
      case PostgresErrors.InvalidType: {
        Object.entries(request.query.filter || {}).forEach(([key, value]) => {
          const test =
            typeof value === 'object' ? Object.values(value).pop() : value;
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
            pointer: `/data/attributes/${matches[0]}`,
          },
          detail: `Duplicate value '${matches[1]}' in the '${matches[0]}' attribute`,
        });
        statusCode = 409;
        break;
      }

      case PostgresErrors.OutOfRange: {
        const errorMsg = error.driverError.message;
        errors.push({
          detail: errorMsg.charAt(0).toUpperCase() + errorMsg.slice(1),
        });
        break;
      }

      case PostgresErrors.KeyConstraint: {
        errors.push({
          detail: 'You must clean entity relationships before this operation',
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

    const preparedError = new HttpException({ errors }, statusCode);
    preparedError.stack = error.stack;
    return preparedError;
  }
}
