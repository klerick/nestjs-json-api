import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AtomicInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const isAtomic = context.getArgByIndex(3);
    if (isAtomic) {
      console.log('call from atomic operation');
    }
    return next.handle();
  }
}
