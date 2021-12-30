import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ExecutionContext,
  NestInterceptor,
  HttpException,
  CallHandler,
  Injectable, Inject, Logger
} from '@nestjs/common';

import { mixin } from '../../helpers/mixin';
import {
  preparePostgresError,
  prepareHttpError,
} from '../../helpers/messages';
import {
  InterceptorMixin,
  PostgresErrors,
} from '../../types';


export function interceptorMixin(): InterceptorMixin {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    @Inject(Logger) protected logger: Logger;

    public async intercept(
      context: ExecutionContext,
      next: CallHandler
    ): Promise<Observable<any>> {
      return next.handle().pipe(
        catchError(error => {
          this.logger.error(error);

          if (Object.values(PostgresErrors).includes(error.code)) {
            return throwError(() => preparePostgresError(context, error));
          }

          if (error instanceof HttpException) {
            return throwError(() => prepareHttpError(context, error));
          }

          const preparedError = new HttpException({
            errors: [{
              detail: 'Internal server error',
            }]
          }, 500);
          preparedError.stack = error.stack;
          return throwError(() => preparedError);
        })
      );
    }
  }

  return mixin(MixinInterceptor);
}
