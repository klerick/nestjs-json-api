import { Body, Controller, Inject, Post, UseFilters } from '@nestjs/common';
import { HandlerService } from '../../util/service';
import { InputDataPipe } from '../../util/pipe/input-data.pipe';
import { PayloadRpcData, RpcResult } from '../../../types';
import { RpcErrorObject } from '../../../types/error-payloade';
import { RpcErrorExceptionFilter } from '../filter/rpc-error-exception.filter';

@Controller('/')
export class JsonRpcController {
  @Inject(HandlerService) private readonly handlerService!: HandlerService;

  @Post('')
  @UseFilters(new RpcErrorExceptionFilter())
  async handler(
    @Body(InputDataPipe) body: PayloadRpcData
  ): Promise<RpcResult | RpcErrorObject | Array<RpcResult | RpcErrorObject>> {
    return this.handlerService.runRpc(body);
  }
}
