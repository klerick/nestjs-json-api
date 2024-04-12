import type { Socket } from 'socket.io-client';
import {
  filter,
  Observable,
  Observer,
  of,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { Subscriber } from 'rxjs/internal/Subscriber';
import { TeardownLogic } from 'rxjs/internal/types';

import { LoopFunc, PayloadRpc, RpcResult, Transport } from '../types';
import { WS_EVENT_NAME } from '../constans';

interface ServerToClientEvents<T extends LoopFunc> {
  rpc: (result: RpcResult<T>) => void;
}

interface ClientToServerEvents<T extends LoopFunc> {
  rpc: (payload: PayloadRpc<T>) => void;
}

class SocketIo<T extends LoopFunc> extends Observable<RpcResult<T>> {
  private messageQueue: PayloadRpc<T>[] = [];
  constructor(
    private io: Socket<ServerToClientEvents<T>, ClientToServerEvents<T>>
  ) {
    super((subscriber) => this.subscribeForObservable(subscriber));
    this.io.on('connect', () => {
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (!msg) break;
        this.io.emit(WS_EVENT_NAME, msg);
      }
    });
  }

  private subscribeForObservable(
    subscriber: Subscriber<RpcResult<T>>
  ): TeardownLogic {
    this.io.on(WS_EVENT_NAME, (value) => subscriber.next(value));
    this.io.on('connect_error', (error: Error) => subscriber.error(error));
    this.io.on('disconnect', () => subscriber.complete());
    return { unsubscribe: () => this.io.close() };
  }

  public next(message: PayloadRpc<T>): void {
    if (!this.io.connected) {
      this.messageQueue.push(message);
      return;
    }

    this.io.emit(WS_EVENT_NAME, message);
  }
}

export function ioTransportFactory<T extends LoopFunc>(
  io: Socket<ServerToClientEvents<T>, ClientToServerEvents<T>>,
  destroyFactory: Subject<boolean>
): Transport<T> {
  const socketSubject = new SocketIo(io).pipe(takeUntil(destroyFactory));
  return (body: PayloadRpc<T>) => {
    const { id } = body;
    return of(true).pipe(
      tap(() => io.emit(WS_EVENT_NAME, body)),
      switchMap(() =>
        socketSubject.pipe(filter((response) => response.id === id))
      ),
      take(1)
    );
  };
}
