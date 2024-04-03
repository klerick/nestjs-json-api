import { filter, of, Subject, switchMap, take, tap } from 'rxjs';
import type { Socket } from 'socket.io-client';
import { LoopFunc, PayloadRpc, RpcResult, Transport } from '../types';
import { WS_EVENT_NAME } from '../constans';

interface ServerToClientEvents<T extends LoopFunc> {
  rpc: (result: RpcResult<T>) => void;
}

interface ClientToServerEvents<T extends LoopFunc> {
  rpc: (payload: PayloadRpc<T>) => void;
}

export function ioTransportFactory<T extends LoopFunc>(
  io: Socket<ServerToClientEvents<T>, ClientToServerEvents<T>>
): Transport<T> {
  const subjectData = new Subject<RpcResult<T>>();
  io.on(WS_EVENT_NAME, (event) => subjectData.next(event));

  return (body: PayloadRpc<T>) => {
    const { id } = body;
    return of(true).pipe(
      tap(() => io.emit(WS_EVENT_NAME, body)),
      switchMap(() =>
        subjectData.pipe(filter((response) => response.id === id))
      ),
      take(1)
    );
  };
}
