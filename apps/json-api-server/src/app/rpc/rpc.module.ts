import { Module } from '@nestjs/common';
import { NestjsJsonRpcModule, TransportType } from '@klerick/nestjs-json-rpc';

@Module({
  imports: [
    NestjsJsonRpcModule.forRootAsync({
      path: 'rpc',
      transport: TransportType.HTTP,
    }),
  ],
  // providers: [ContestRpc, ParseIntArrayPipe, LineUpSchemaPipe],
})
export class RpcModule {}
