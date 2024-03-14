import { RpcConfig, RpcReturnList, RpcBatch, RpcBatchPromise } from '../types';
import { transportFactory } from './transport.factory';
import { RpcBatchFactory, rpcProxy, RpcBatchFactoryPromise } from '../utils';

type ResultRpcFactory<T extends object> = {
  rpc: RpcReturnList<T, false>;
  rpcBatch: RpcBatch;
};
type ResultRpcFactoryPromise<T extends object> = {
  rpc: RpcReturnList<T, true>;
  rpcForBatch: RpcReturnList<T, false>;
  rpcBatch: RpcBatchPromise;
};

export function RpcFactory<T extends object>(
  options: RpcConfig,
  usePromise: false
): ResultRpcFactory<T>;
export function RpcFactory<T extends object>(
  options: RpcConfig,
  usePromise: true
): ResultRpcFactoryPromise<T>;
export function RpcFactory<T extends object>(
  options: RpcConfig,
  usePromise: true | false = false
): ResultRpcFactory<T> | ResultRpcFactoryPromise<T> {
  const transport = transportFactory(options);
  let rpc: RpcReturnList<T, true> | RpcReturnList<T, false>;
  let rpcForBatch: RpcReturnList<T, false>;

  if (usePromise) {
    rpc = rpcProxy<RpcReturnList<T, true>>(transport, usePromise);
    rpcForBatch = rpcProxy<RpcReturnList<T, false>>(transport, usePromise);
    return { rpc, rpcForBatch, rpcBatch: RpcBatchFactoryPromise(transport) };
  } else {
    rpc = rpcProxy<RpcReturnList<T, false>>(transport, usePromise);
    return { rpc, rpcBatch: RpcBatchFactory(transport) };
  }
}
