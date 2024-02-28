import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

import { Entity, ResourceObject } from '../../types';

export class LogTimeInterceptors<E extends Entity> implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<ResourceObject<E>>
  ): Observable<any> | Promise<Observable<any>> {
    const now = Date.now();
    return next.handle().pipe(
      map((r) => {
        const response = context.switchToHttp().getResponse();
        const time = Date.now() - now;
        response.setHeader('x-response-time', time);
        if (r && r.meta) {
          r.meta['time'] = time;
        }

        return r;
      })
    );
  }
}
