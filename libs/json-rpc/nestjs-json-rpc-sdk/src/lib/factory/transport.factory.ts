import { fromFetch } from 'rxjs/fetch';
import {
  RpcConfig,
  Transport,
  TransportType,
  RpcHttpConfig,
  LoopFunc,
  PayloadRpc,
  RpcResult,
} from '../types';

function httpTransport<T extends LoopFunc>(
  config: RpcHttpConfig
): Transport<T> {
  const url = new URL(config.rpcPath, config.rpcHost).toString();
  if (config.httpAgentFactory) {
    return config.httpAgentFactory(url);
  }

  return (body: PayloadRpc<T>) =>
    fromFetch<RpcResult<T>>(url, {
      method: 'post',
      body: JSON.stringify(body),
      selector: (r) => r.json(),
    });
}

export function transportFactory<T extends LoopFunc>(
  rpcConfig: RpcConfig
): Transport<T> {
  switch (rpcConfig.transport) {
    case TransportType.HTTP:
      return httpTransport(rpcConfig);
    case TransportType.WS:
      throw new Error('Unknown transport');
    default:
      throw new Error('Unknown transport');
  }
}
