import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ResourceObject } from '@klerick/json-api-nestjs-shared';
import { ErrorFormatService } from '../service';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable()
export class ErrorInterceptors<E extends object> implements NestInterceptor {
  @Inject(ErrorFormatService) private errorFormatService!: ErrorFormatService;

  private static _instance: ErrorInterceptors<any>;
  constructor() {
    if (ErrorInterceptors._instance) {
      return ErrorInterceptors._instance;
    }
    ErrorInterceptors._instance = this;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<ResourceObject<E>>
  ): Observable<ResourceObject<E>> {
    return next
      .handle()
      .pipe(
        catchError((error) =>
          throwError(() => this.errorFormatService.formatError(error))
        )
      );
  }
}
