import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { Inject, UseFilters, UsePipes } from '@nestjs/common';
import { HandlerService } from '../../util/service';
import { PayloadRpcData, RpcErrorObject, RpcResult } from '../../../types';
import { InputDataPipe } from '../../util/pipe/input-data.pipe';
import { WS_EVENT_NAME } from '../constants';
import { RpcWsErrorExceptionFilter } from '../filter/rpc-ws-error-exception.filter';

type WsRpcResponse = WsResponse<
  RpcResult | RpcErrorObject | Array<RpcResult | RpcErrorObject>
>;

@WebSocketGateway()
export class WebSocketGatewayService {
  @Inject(HandlerService) private readonly handlerService!: HandlerService;

  @UsePipes(InputDataPipe)
  @UseFilters(new RpcWsErrorExceptionFilter())
  @SubscribeMessage(WS_EVENT_NAME)
  async run(@MessageBody() body: PayloadRpcData): Promise<WsRpcResponse> {
    const result = await this.handlerService.runRpc(body);
    return { data: result, event: WS_EVENT_NAME };
  }
}
