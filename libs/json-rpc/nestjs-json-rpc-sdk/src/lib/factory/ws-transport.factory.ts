import { filter, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { map } from 'rxjs/operators';
import { WS_EVENT_NAME } from '../constans';
import { LoopFunc, PayloadRpc, RpcResult, Transport, WsEvent } from '../types';
import { WebSocketSubject } from 'rxjs/internal/observable/dom/WebSocketSubject';

export interface WsResponse<T = unknown> {
  event: WsEvent;
  data: T;
}

export function webSocketFactory<T extends LoopFunc>(
  url: string,
  webSocketCtor?: any
): WebSocketSubject<WsResponse<PayloadRpc<LoopFunc> | RpcResult<LoopFunc>>> {
  return webSocket<WsResponse<PayloadRpc<T> | RpcResult<T>>>({
    url,
    ...(webSocketCtor ? { WebSocketCtor: webSocketCtor } : {}),
  });
}

export function wsTransportFactory<T extends LoopFunc>(
  subject: WebSocketSubject<
    WsResponse<PayloadRpc<LoopFunc> | RpcResult<LoopFunc>>
  >,
  destroyFactory: Subject<boolean>
): Transport<T> {
  const subjectData = new Subject<RpcResult<T>>();
  subject
    .pipe(
      filter((response): response is WsResponse<RpcResult<T>> => {
        if (typeof response !== 'object' || response === null) return false;
        return 'event' in response && response['event'] === 'rpc';
      }),
      map((response) => response.data),
      takeUntil(destroyFactory)
    )
    .subscribe((r) => subjectData.next(r));

  return (body: PayloadRpc<T>) => {
    const { id } = body;
    return of(true).pipe(
      tap(() =>
        subject.next({
          event: WS_EVENT_NAME,
          data: body,
        })
      ),
      switchMap(() =>
        subjectData.pipe(filter((response) => response.id === id))
      ),
      take(1)
    );
  };
}
