import {
  DynamicModule,
  ForwardReference,
  Provider,
  Type,
} from '@nestjs/common';
import { GatewayMetadata } from '@nestjs/websockets/interfaces';

export enum TransportType {
  HTTP,
  WS,
}

export type HttpTransportConfig = {
  transport: TransportType.HTTP;
  path: string;
};

export type WSTransportConfig = {
  transport: TransportType.WS;
  wsConfig: GatewayMetadata;
};

export type CommonRpcConfig = {
  providers?: Provider[];
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
};

export type JsonRpcHttpConfig = CommonRpcConfig & HttpTransportConfig;
export type JsonRpcWsConfig = CommonRpcConfig & WSTransportConfig;

export type JsonRpcConfig = JsonRpcHttpConfig | JsonRpcWsConfig;
