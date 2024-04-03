import { Injectable, Module, ParseIntPipe, UsePipes } from '@nestjs/common';
import { NestjsJsonRpcModule, TransportType } from '@klerick/nestjs-json-rpc';
import { RpcService } from './service/rpc.service';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ArgumentMetadata,
  PipeTransform,
} from '@nestjs/common/interfaces/features/pipe-transform.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/rpc/',
})
class TesWebSocketService {
  constructor() {
    console.log(1213);
  }

  @UsePipes(ParseIntPipe)
  @SubscribeMessage('events')
  findAll(@MessageBody() data: number): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(
      map((item) => ({ event: 'events', data: item }))
    );
  }
}

@Module({
  imports: [
    NestjsJsonRpcModule.forRootAsync({
      path: 'rpc',
      transport: TransportType.HTTP,
    }),
    NestjsJsonRpcModule.forRootAsync({
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
