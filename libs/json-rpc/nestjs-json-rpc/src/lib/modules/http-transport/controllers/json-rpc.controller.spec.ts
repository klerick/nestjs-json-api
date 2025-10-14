import { Test } from '@nestjs/testing';
import { JsonRpcController } from './json-rpc.controller';
import { UtilModule } from '../../util/util.module';
import { HandlerService } from '../../util/service';

describe('json-rpc.controller', () => {
  let jsonRpcController: JsonRpcController;
  let handlerService: HandlerService;
  beforeEach(async () => {
    const testModuleRef = await Test.createTestingModule({
      imports: [UtilModule],
      providers: [JsonRpcController],
    }).compile();

    jsonRpcController = testModuleRef.get(JsonRpcController);
    handlerService = testModuleRef.get(HandlerService);
  });

  it('Should be call HandlerService', async () => {
    const result = {
      jsonrpc: '2.0',
      id: 1,
      result: 1 as any,
    };
    const input = {
      jsonrpc: '2.0',
      id: 1,
      params: [1],
      method: {
        methodName: 'test',
        spaceName: 'test',
      },
    };
    const spyHandlerServiceCallHandler = vi
      .spyOn(handlerService, 'callHandler')
      .mockResolvedValue(result as any);
    const resultController = jsonRpcController.handler(input as any);
    expect(spyHandlerServiceCallHandler).toHaveBeenCalledWith(input);
    expect(spyHandlerServiceCallHandler).toHaveBeenCalledTimes(1);
    expect(resultController).resolves.toEqual(result);
  });
});
