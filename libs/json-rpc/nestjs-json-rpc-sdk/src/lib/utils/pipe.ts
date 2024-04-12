import { OperatorFunction, pipe, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  LoopFunc,
  ReturnGenericType,
  ReturnTransportCall,
  RpcError,
  RpcResult,
} from '../types';

export const mapParseResponse = <T extends LoopFunc>(r: RpcResult<T>) => {
  if ('error' in r) return r;
  return r.result;
};

export const throwOrReturnError = <T extends LoopFunc>(returnError = false) => {
  return (r: ReturnTransportCall<T>) => {
    if (!(typeof r === 'object' && r !== null && 'error' in r)) {
      return r;
    }
    const error = new RpcError(r);
    if (!returnError) throw error;
    return error;
  };
};

export function parseResponse<T extends LoopFunc>(): OperatorFunction<
  RpcResult<T>,
  ReturnTransportCall<T>
> {
  return pipe(map(mapParseResponse));
}

export function throwRpcError<T extends LoopFunc>(): OperatorFunction<
  ReturnTransportCall<T>,
  ReturnGenericType<T>
> {
  return pipe(map((r) => throwOrReturnError()(r)));
}
