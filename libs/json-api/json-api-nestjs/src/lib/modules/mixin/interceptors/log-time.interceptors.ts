import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ResourceObject } from '@klerick/json-api-nestjs-shared';

import { map, Observable } from 'rxjs';

@Injectable()
export class LogTimeInterceptors<E extends object> implements NestInterceptor {
  private static _instance: LogTimeInterceptors<any>;
  constructor() {
    if (LogTimeInterceptors._instance) {
      return LogTimeInterceptors._instance;
    }
    LogTimeInterceptors._instance = this;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<ResourceObject<E>>
  ): Observable<ResourceObject<E>> {
    const now = performance.now();
    return next.handle().pipe(
      map((r) => {
        const response = context.switchToHttp().getResponse();
        const time = performance.now() - now;
        response.setHeader('x-response-time', time);
        if (r && r.meta) {
          r.meta['time'] = time;
        }

        return r;
      })
    );
  }
}
