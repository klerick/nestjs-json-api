import { Observable } from 'rxjs';
import { RpcErrorObject } from './rpc-error-object';
import { LoopFunc, ReturnGenericType } from './utils';

export type JsonRpcVersion = '2.0';

export type WsEvent = 'rpc';

export type PayloadRpc<T extends LoopFunc> = {
  jsonrpc: JsonRpcVersion;
  method: string;
  params: Parameters<T>;
  id: number;
};

export type IdRequest = () => number;

export type RpcResultObject<T extends LoopFunc> = {
  jsonrpc: JsonRpcVersion;
  result: ReturnGenericType<T>;
  id: number;
};

export type RpcResult<T extends LoopFunc> = RpcErrorObject | RpcResultObject<T>;

export type ReturnTransportCall<T extends LoopFunc> =
  | ReturnGenericType<T>
  | RpcErrorObject;

export type Transport<T extends LoopFunc> = (
  body: PayloadRpc<T>
) => Observable<RpcResult<T>>;

export type RpcReturnList<R, P extends boolean> = {
  [K in keyof R]: RpcCallReturnChange<R[K], P>;
};

export interface WrapperCallRpc<T, P> extends Observable<T> {
  nameSpace: string;
  method: string;
  arg: P;
  id: number;
  body: {
    jsonrpc: JsonRpcVersion;
    method: string;
    params: P;
    id: number;
  };
}

type CallFunction<T extends LoopFunc, P> = T extends (...args: infer Z) => any
  ? (
      ...arg: Z
    ) => P extends false
      ? WrapperCallRpc<ReturnGenericType<T>, Parameters<T>>
      : Promise<ReturnGenericType<T>>
  : never;

export type RpcCallReturnChange<R, P> = {
  [K in keyof R]: R[K] extends LoopFunc ? CallFunction<R[K], P> : never;
};

export type OutputData<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends WrapperCallRpc<infer O, any>
    ? O | RpcErrorObject
    : never;
};

export type RpcBatch = <A extends readonly WrapperCallRpc<unknown, unknown>[]>(
  ...arg: readonly [...A]
) => Observable<OutputData<A>>;

export type RpcBatchPromise = <
  A extends readonly WrapperCallRpc<unknown, unknown>[]
>(
  ...arg: readonly [...A]
) => Promise<OutputData<A>>;
