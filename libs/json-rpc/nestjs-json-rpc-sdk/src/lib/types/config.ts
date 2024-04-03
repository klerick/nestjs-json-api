import { Transport } from './rpc';
import { HttpAgentFactory, LoopFunc } from './utils';

import type { Socket } from 'socket.io-client';

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

export type RpcWsConfig = {
  transport: TransportType.WS;
} & UseNativeSocket;

export type RpcConfig = RpcHttpConfig | RpcWsConfig;
