import {
  RpcMainHttpConfig,
  RpcNativeSocketFactory,
  RpcNativeSocketFalse,
  RpcNativeSocketTrue,
  TransportType,
} from './config';
import { RpcReturnList } from './rpc';

type RpcWsMainConfig = {
  transport: TransportType.WS;
  destroySubjectToken?: any;
};

type RpcTokenForWs = {
  tokenSocketInst: any;
};

type RpcNativeConfig = RpcNativeSocketTrue &
  (RpcNativeSocketFactory | RpcTokenForWs);

type RpcIoConfig = RpcNativeSocketFalse & RpcTokenForWs;

type RpcAngularWsConfig = RpcWsMainConfig & (RpcNativeConfig | RpcIoConfig);

export type JsonRpcAngularConfig = RpcMainHttpConfig | RpcAngularWsConfig;

export type Rpc<T extends object> = RpcReturnList<T, false>;
