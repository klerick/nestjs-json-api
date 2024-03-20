import { Observable } from 'rxjs';
import { LoopFunc, PayloadRpc, ReturnTransportCall, Transport } from '../types';
import { generateBody, generateBodyMethod } from './body';
import { idRequest } from '../factory/id-request';
import { parseResponse, throwRpcError } from './pipe';

export class WrapperCall<T extends LoopFunc> extends Observable<
  ReturnTransportCall<T>
> {
  id: number = idRequest();
  body!: PayloadRpc<T>;
  constructor(
    private nameSpace: string,
    private method: string,
    private arg: Parameters<T>,
    private transport: Transport<T>
  ) {
    super((subscriber) => {
      const transportSubscribe = this.transport(this.body)
        .pipe(parseResponse(), throwRpcError())
        .subscribe({
          next: (r) => subscriber.next(r),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      return { unsubscribe: () => transportSubscribe.unsubscribe() };
    });
    this.body = generateBody<T>(
      generateBodyMethod(this.nameSpace, this.method),
      this.arg,
      this.id
    );
  }
}
