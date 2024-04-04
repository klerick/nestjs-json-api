import { PayloadRpc, RpcResult, Transport } from './rpc';
import { HttpAgentFactory, LoopFunc } from './utils';

import type { Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/internal/observable/dom/WebSocketSubject';
import { WsResponse } from '../factory/ws-transport.factory';

export enum TransportType {
  HTTP,
  WS,
}

export type RpcMainHttpConfig = {
  transport: TransportType.HTTP;
  rpcPath: string;
  rpcHost: string;
};

export type RpcTransportHttpConfig = {
  httpAgentFactory?: HttpAgentFactory<Transport<LoopFunc>>;
};

export type RpcHttpConfig = RpcMainHttpConfig & RpcTransportHttpConfig;

type UseNativeSocket =
  | {
      useWsNativeSocket: true;
      rpcPath: string;
      rpcHost: string;
      webSocketCtor?: {
        new (url: string, protocols?: string | string[]): any;
      };
    }
  | {
      useWsNativeSocket: false;
      webSocketCtor: Socket;
    };

export type RpcNativeSocketFactory = {
  rpcPath: string;
  rpcHost: string;
  nativeSocketImplementation?: {
    new (url: string, protocols?: string | string[]): any;
  };
};

export type RpcNativeSocketInstance = {
  nativeSocketInstance: WebSocketSubject<
    WsResponse<PayloadRpc<LoopFunc> | RpcResult<LoopFunc>>
  >;
};

export type RpcNativeSocketTrue = {
  useWsNativeSocket: true;
};

export type RpcNativeSocketFalse = {
  useWsNativeSocket: false;
};

export type RpcNativeSocket = RpcNativeSocketTrue &
  (RpcNativeSocketFactory | RpcNativeSocketInstance);

export type RpcWsMainConfig = {
  transport: TransportType.WS;
  destroySubject?: Subject<boolean>;
};

export type RpcIoSocketInstance = {
  ioSocketInstance: Socket;
};

export type RpcIoSocket = RpcNativeSocketFalse & RpcIoSocketInstance;

export type RpcWsConfig = RpcWsMainConfig & (RpcNativeSocket | RpcIoSocket);

export type RpcConfig = RpcHttpConfig | RpcWsConfig;
