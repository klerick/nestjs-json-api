import {
  LoopFunc,
  RpcBatch,
  RpcBatchPromise,
  RpcResult,
  Transport,
} from '../types';
import { map } from 'rxjs/operators';
import { mapParseResponse, throwOrReturnError } from './pipe';
import { lastValueFrom } from 'rxjs';

export function RpcBatchFactory<T extends LoopFunc>(
  transport: Transport<T>
): RpcBatch {
  const returnError = throwOrReturnError(true);
  return (...arg) => {
    const bodyArray = arg.map((i) => i.body);

    const sortMap = bodyArray.reduce((acum, item, currentIndex) => {
      acum[item.id] = currentIndex;
      return acum;
    }, {} as Record<number, number>);

    bodyArray.sort((a, b) => a.id - b.id);

    return transport(bodyArray as any).pipe(
      map((r) => r as unknown as RpcResult<T>[]),
      map((r) => r.sort((a, b) => sortMap[a.id || 0] - sortMap[b.id || 0])),
      map((r) => r.map(mapParseResponse) as any),
      map((r) => r.map(returnError) as any)
    );
  };
}

export function RpcBatchFactoryPromise<T extends LoopFunc>(
  transport: Transport<T>
): RpcBatchPromise {
  const rpcBatch = RpcBatchFactory<T>(transport);
  return (...arg) => lastValueFrom(rpcBatch(...arg));
}
