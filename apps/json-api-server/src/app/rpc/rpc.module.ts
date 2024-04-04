import { Module } from '@nestjs/common';
import { NestjsJsonRpcModule, TransportType } from '@klerick/nestjs-json-rpc';
import { RpcService } from './service/rpc.service';

@Module({
  imports: [
    NestjsJsonRpcModule.forRoot({
      path: 'rpc',
      transport: TransportType.HTTP,
    }),
    NestjsJsonRpcModule.forRoot({
      transport: TransportType.WS,
      wsConfig: {
        path: '/rpc',
        cors: {
          origin: '*',
        },
      },
    }),
  ],
  providers: [RpcService],
})
export class RpcModule {}
