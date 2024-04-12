import {
  RpcConfig,
  Transport,
  TransportType,
  RpcHttpConfig,
  RpcWsConfig,
  LoopFunc,
  PayloadRpc,
  RpcResult,
} from '../types';
import { fetchTransportFactory } from './fetch-transport.factory';
import {
  webSocketFactory,
  WsResponse,
  wsTransportFactory,
} from './ws-transport.factory';
import { ioTransportFactory } from './io-transport.factory';
import { Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/internal/observable/dom/WebSocketSubject';

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
  const destroyFactory = config.destroySubject || new Subject();
  if (config.useWsNativeSocket) {
    let nativeSocketInstance: WebSocketSubject<
      WsResponse<PayloadRpc<LoopFunc> | RpcResult<LoopFunc>>
    >;
    if ('nativeSocketInstance' in config) {
      nativeSocketInstance = config.nativeSocketInstance;
    } else {
      const url = new URL(config.rpcPath, config.rpcHost).toString();
      nativeSocketInstance = webSocketFactory(
        url,
        config.nativeSocketImplementation
      );
    }

    return wsTransportFactory(
      nativeSocketInstance,
      config.destroySubject || new Subject<boolean>()
    );
  }

  return ioTransportFactory(config.ioSocketInstance, destroyFactory);
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
