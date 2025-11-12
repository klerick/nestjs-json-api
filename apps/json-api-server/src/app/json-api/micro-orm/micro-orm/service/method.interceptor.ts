import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ImATeapotException } from '@nestjs/common/exceptions/im-a-teapot.exception';
import { PreconditionFailedException } from '@nestjs/common/exceptions/precondition-failed.exception';

@Injectable()
export class MethodInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const query = context.switchToHttp().getRequest<Request>().query;
    const typeCall = (query as any)?.filter?.firstName?.eq;

    return of(typeCall).pipe(
      switchMap((r) => {
        if (r === 'testMethodFilter') {
          return throwError(() => new PreconditionFailedException());
        }
        return next.handle();
      }),
      map((r) => {
        if (typeCall === 'testMethodInterceptor') {
          const error = {
            code: 'invalid_arguments',
            message: `testMethodInterceptor error`,
            path: [],
          };
          throw new BadRequestException([error]);
        }
        return r;
      })
    );
  }
}
