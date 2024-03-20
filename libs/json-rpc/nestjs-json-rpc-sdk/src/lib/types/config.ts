import { Observable } from 'rxjs';
import { Transport } from './rpc';
import { HttpAgentFactory, LoopFunc } from './utils';

export enum TransportType {
  HTTP,
  WS,
}

// export type RpcHttpConfig = {
//   rpcPath: string;
//   rpcHost: string;
//   transport: TransportType.HTTP;
//   httpAgent?: <T>(data: T) => Promise<T>;
// };

// export type HttpConfig = {
//   transport: TransportType.HTTP,
//   rpcPath: string;
//   rpcHost: string;
//   httpAgent?: <T>(data: T) => Promise<T>;
// };

export type RpcMainHttpConfig = {
  transport: TransportType.HTTP;
  rpcPath: string;
  rpcHost: string;
};

export type RpcTransportHttpConfig = {
  httpAgentFactory?: HttpAgentFactory<Transport<LoopFunc>>;
};

export type RpcHttpConfig = RpcMainHttpConfig & RpcTransportHttpConfig;

export type RpcWsConfig = {
  transport: TransportType.WS;
  rpcPath: string;
  rpcHost: string;
  rpcPort: number;
};

export type RpcConfig = RpcHttpConfig | RpcWsConfig;
