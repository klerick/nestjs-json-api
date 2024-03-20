import { Module } from '@nestjs/common';
import { NestjsJsonRpcModule, TransportType } from '@klerick/nestjs-json-rpc';
import { RpcService } from './service/rpc.service';

@Module({
  imports: [
    NestjsJsonRpcModule.forRootAsync({
      path: 'rpc',
      transport: TransportType.HTTP,
    }),
  ],
  providers: [RpcService],
})
export class RpcModule {}
