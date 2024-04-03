import {
  RpcConfig,
  Transport,
  TransportType,
  RpcHttpConfig,
  RpcWsConfig,
  LoopFunc,
} from '../types';
import { fetchTransportFactory } from './fetch-transport.factory';
import { wsTransportFactory } from './ws-transport.factory';
import { ioTransportFactory } from './io-transport.factory';

function httpTransport<T extends LoopFunc>(
  config: RpcHttpConfig
): Transport<T> {
  const url = new URL(config.rpcPath, config.rpcHost).toString();
  if (config.httpAgentFactory) {
    return config.httpAgentFactory(url);
  }

  return fetchTransportFactory(url);
}

function wsTransport<T extends LoopFunc>(config: RpcWsConfig): Transport<T> {
  if (config.useWsNativeSocket) {
    const url = new URL(config.rpcPath, config.rpcHost).toString();
    return wsTransportFactory(url, config.webSocketCtor);
  }

  return ioTransportFactory(config.webSocketCtor);
}

export function transportFactory<T extends LoopFunc>(
  rpcConfig: RpcConfig
): Transport<T> {
  switch (rpcConfig.transport) {
    case TransportType.HTTP:
      return httpTransport(rpcConfig);
    case TransportType.WS:
      return wsTransport(rpcConfig);
    default:
      throw new Error('Unknown transport');
  }
}
