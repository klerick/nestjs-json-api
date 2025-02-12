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

@Injectable()
export class ControllerInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const query = context.switchToHttp().getRequest<Request>().query;
    const typeCall = (query as any)?.filter?.firstName?.eq;

    return of(typeCall).pipe(
      switchMap((r) => {
        if (r === 'testControllerFilter') {
          return throwError(() => new ImATeapotException());
        }
        return next.handle();
      }),
      map((r) => {
        if (typeCall === 'testControllerInterceptor') {
          const error = {
            code: 'invalid_arguments',
            message: `testControllerInterceptor error`,
            path: [],
          };
          throw new BadRequestException([error]);
        }
        return r;
      })
    );
  }
}
