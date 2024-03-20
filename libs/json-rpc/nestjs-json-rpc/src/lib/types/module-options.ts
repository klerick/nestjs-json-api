import {
  DynamicModule,
  ForwardReference,
  Provider,
  Type,
} from '@nestjs/common';

export enum TransportType {
  HTTP,
  WS,
}

export type HttpTransportConfig = {
  transport: TransportType.HTTP;
  path: string;
};

export type CommonRpcConfig = {
  providers?: Provider[];
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
};

export type JsonRpcConfig = CommonRpcConfig & HttpTransportConfig;
