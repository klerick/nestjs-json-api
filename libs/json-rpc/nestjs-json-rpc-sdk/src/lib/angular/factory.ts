import { inject, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/internal/observable/dom/WebSocketSubject';
import { Socket } from 'socket.io-client';

import {
  LoopFunc,
  PayloadRpc,
  RpcResult,
  RpcReturnList,
  RpcConfig,
  TransportType,
} from '../types';
import { transportFactory } from '../factory';
import { webSocketFactory, WsResponse } from '../factory/ws-transport.factory';

import { JSON_RPC_SDK_CONFIG, JSON_RPC_SDK_TRANSPORT } from './tokens';
import { RpcBatchFactory, rpcProxy } from '../utils';

export function rpcBatchFactory() {
  return RpcBatchFactory(inject(JSON_RPC_SDK_TRANSPORT));
}

export function rpcFactory() {
  return rpcProxy<RpcReturnList<any, true>>(
    inject(JSON_RPC_SDK_TRANSPORT),
    false
  );
}

export function angularTransportFactory() {
  const angularConfig = inject(JSON_RPC_SDK_CONFIG);
  const httpClient = inject(HttpClient);

  if (angularConfig.transport === TransportType.HTTP) {
    const rpcConfig: RpcConfig = {
      transport: angularConfig.transport,
      httpAgentFactory: (url: string) => (body: PayloadRpc<LoopFunc>) =>
        httpClient.post<RpcResult<LoopFunc>>(url, body),
      rpcPath: angularConfig.rpcPath,
      rpcHost: angularConfig.rpcHost,
    };
    return transportFactory(rpcConfig);
  }

  const destroySubject =
    (angularConfig.destroySubjectToken &&
      inject<Subject<boolean>>(angularConfig.destroySubjectToken, {
        optional: true,
      })) ||
    new Subject<boolean>();

  if (angularConfig.useWsNativeSocket) {
    let socketInst:
      | WebSocketSubject<WsResponse<PayloadRpc<LoopFunc> | RpcResult<LoopFunc>>>
      | undefined = undefined;
    if ('tokenSocketInst' in angularConfig) {
      socketInst =
        inject<
          WebSocketSubject<
            WsResponse<PayloadRpc<LoopFunc> | RpcResult<LoopFunc>>
          >
        >(angularConfig['tokenSocketInst'], { optional: true }) || undefined;
    } else {
      const url = new URL(
        angularConfig.rpcPath,
        angularConfig.rpcHost
      ).toString();
      socketInst = webSocketFactory(
        url,
        angularConfig.nativeSocketImplementation
      );
    }

    if (socketInst === undefined) throw new Error('Cant create socket inst');
    const rpcConfig: RpcConfig = {
      transport: angularConfig.transport,
      useWsNativeSocket: angularConfig.useWsNativeSocket,
      nativeSocketInstance: socketInst,
      destroySubject,
    };

    return transportFactory(rpcConfig);
  }
  const ioSocketInstance = inject<Socket>(angularConfig['tokenSocketInst']);
  const rpcConfig: RpcConfig = {
    transport: angularConfig.transport,
    useWsNativeSocket: angularConfig.useWsNativeSocket,
    ioSocketInstance: ioSocketInstance,
    destroySubject,
  };
  return transportFactory(rpcConfig);
}
