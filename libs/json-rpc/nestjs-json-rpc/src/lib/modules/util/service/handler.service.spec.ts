import { HandlerService } from './handler.service';
import { Test } from '@nestjs/testing';
import { ParseIntPipe, ParseBoolPipe } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { createError, RpcError } from '../../../utils';
import { mapHandlerStoreProvider, AsyncIterate } from '../../../providers';
import { ErrorCode, MAP_HANDLER } from '../../../constants';
import { RpcParamsPipe } from '../../../decorators';
import { ErrorCodeType, PayloadRpcData } from '../../../types';

class RpcTestClass {
  rpcTestMethode(
    @RpcParamsPipe(ParseIntPipe) firstInputParam: number,
    @RpcParamsPipe(ParseIntPipe) secondInputParam: number
  ): { firstInputParam: number; secondInputParam: number } {
    return { firstInputParam, secondInputParam };
  }

  rpcTest2Methode(
    @RpcParamsPipe(ParseIntPipe) firstInputParam: number,
    secondInputParam: boolean
  ): { firstInputParam: number; secondInputParam: boolean } {
    return { firstInputParam, secondInputParam };
  }
}

describe('handler.service', () => {
  let handlerService: HandlerService;
  let mapHandler: Map<string, unknown>;
  let moduleRef: ModuleRef;
  beforeEach(async () => {
    const testModuleRef = await Test.createTestingModule({
      providers: [HandlerService, mapHandlerStoreProvider, AsyncIterate],
      controllers: [ParseIntPipe],
    }).compile();

    handlerService = testModuleRef.get(HandlerService);
    mapHandler = testModuleRef.get(MAP_HANDLER);
    moduleRef = testModuleRef.get(ModuleRef);
  });

  describe('runRpc', () => {
    it('Should be result', async () => {
      const params = ['1', '2'];
      const jsonrpc = '2.0';
      const handlerServiceCallHandlerSpy = jest
        .spyOn(handlerService, 'callHandler')
        .mockResolvedValue({
          jsonrpc,
          result: params.map((i) => parseInt(i, 10)),
          id: null,
        });
      const rpcData: PayloadRpcData = {
        params,
        jsonrpc,
        method: {
          methodName: 'Test',
          spaceName: 'testMethode',
        },
        id: 1,
      };
      const result = await handlerService.runRpc(rpcData);
      expect(result).toEqual({
        jsonrpc,
        result: params.map((i) => parseInt(i, 10)),
        id: rpcData.id,
      });
      expect(handlerServiceCallHandlerSpy).toHaveBeenCalledWith(rpcData);
    });
    it('Should be array result', async () => {
      const params = ['1', '2'];
      const params2 = ['3', '4'];
      const jsonrpc = '2.0';
      const rpcData: PayloadRpcData = [
        {
          params,
          jsonrpc,
          method: {
            methodName: 'Test',
            spaceName: 'testMethode',
          },
          id: 1,
        },
        {
          params: params2,
          jsonrpc,
          method: {
            methodName: 'Test',
            spaceName: 'testMethode',
          },
          id: 2,
        },
      ];
      let i = 0;
      const handlerServiceCallHandlerSpy = jest
        .spyOn(handlerService, 'callHandler')
        .mockImplementation(() => {
          return Promise.resolve({
            jsonrpc,
            result: rpcData[i].params.map((i) => parseInt(i as any, 10)),
            id: null,
          } as any).then((r) => {
            i++;
            return r;
          });
        });
      const result = await handlerService.runRpc(rpcData);
      expect(result).toEqual(
        rpcData.map((i) => ({
          jsonrpc: i.jsonrpc,
          result: i.params.map((i) => parseInt(i as any, 10)),
          id: i.id,
        }))
      );
      expect(handlerServiceCallHandlerSpy).toHaveBeenCalledTimes(2);
      expect(handlerServiceCallHandlerSpy).toHaveBeenCalledWith(rpcData[0]);
      expect(handlerServiceCallHandlerSpy).toHaveBeenCalledWith(rpcData[1]);
    });

    it('Should be Error rpcObject', async () => {
      const params = ['1', '2'];
      const jsonrpc = '2.0';
      const title = 'Title Error';
      const description = 'Describe Error';
      const handlerServiceCallHandlerSpy = jest
        .spyOn(handlerService, 'callHandler')
        .mockRejectedValue(
          createError(ErrorCodeType.InvalidRequest, title, description)
        );
      const rpcData: PayloadRpcData = {
        params,
        jsonrpc,
        method: {
          methodName: 'Test',
          spaceName: 'testMethode',
        },
        id: 1,
      };
      const result = await handlerService.runRpc(rpcData);
      expect(handlerServiceCallHandlerSpy).toHaveBeenCalledWith(rpcData);
      expect(result).toEqual({
        jsonrpc,
        error: {
          message: ErrorCodeType.InvalidRequest,
          code: ErrorCode[ErrorCodeType.InvalidRequest],
          data: { title, description },
        },
        id: rpcData.id,
      });
    });
    it('Should be Error rpcObject internalError', async () => {
      const params = ['1', '2'];
      const jsonrpc = '2.0';
      const title = 'Title Error';
      const handlerServiceCallHandlerSpy = jest
        .spyOn(handlerService, 'callHandler')
        .mockRejectedValue(new Error(title));
      const rpcData: PayloadRpcData = {
        params,
        jsonrpc,
        method: {
          methodName: 'Test',
          spaceName: 'testMethode',
        },
        id: 1,
      };
      const result = await handlerService.runRpc(rpcData);
      expect(handlerServiceCallHandlerSpy).toHaveBeenCalledWith(rpcData);
      expect(result).toEqual({
        jsonrpc,
        error: {
          message: ErrorCodeType.ServerError,
          code: ErrorCode[ErrorCodeType.ServerError],
          data: { title },
        },
        id: rpcData.id,
      });
    });
  });

  describe('callHandler', () => {
    it('should be error spaceName', async () => {
      expect.assertions(2);
      try {
        await handlerService.callHandler({
          id: 1,
          params: [],
          jsonrpc: '2.0',
          method: {
            methodName: 'test',
            spaceName: 'NotFoundSpace',
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(RpcError);
        expect((e as RpcError).code).toBe(-32601);
      }
    });
    it('should be error method', async () => {
      class TestSpaceName {}
      mapHandler.set(TestSpaceName.name, new TestSpaceName());
      expect.assertions(2);
      try {
        await handlerService.callHandler({
          id: 1,
          params: [],
          jsonrpc: '2.0',
          method: {
            methodName: 'test',
            spaceName: TestSpaceName.name,
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(RpcError);
        expect((e as RpcError).code).toBe(-32601);
      }
    });
    it('Should be correct result', async () => {
      mapHandler.set(RpcTestClass.name, new RpcTestClass());
      const params = ['3', '4'];
      const result = await handlerService.callHandler({
        id: 1,
        params,
        jsonrpc: '2.0',
        method: {
          methodName: 'rpcTestMethode',
          spaceName: RpcTestClass.name,
        },
      });

      expect(result).toEqual({
        id: null,
        jsonrpc: '2.0',
        result: {
          firstInputParam: parseInt(params[0], 10),
          secondInputParam: parseInt(params[1], 10),
        },
      });
    });
    it('Should be validate error', async () => {
      mapHandler.set(RpcTestClass.name, new RpcTestClass());
      const params = ['sdfsdfsdf', '4'];
      expect.assertions(2);
      try {
        await handlerService.callHandler({
          id: 1,
          params,
          jsonrpc: '2.0',
          method: {
            methodName: 'rpcTestMethode',
            spaceName: RpcTestClass.name,
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(RpcError);
        expect((e as RpcError).code).toBe(-32602);
      }
    });
    it('Should be other error error', async () => {
      class TestSpaceName {
        rpcTestMethode() {
          throw new Error();
        }
      }
      mapHandler.set(TestSpaceName.name, new TestSpaceName());
      const params = ['sdfsdfsdf', '4'];
      expect.assertions(1);
      try {
        await handlerService.callHandler({
          id: 1,
          params,
          jsonrpc: '2.0',
          method: {
            methodName: 'rpcTestMethode',
            spaceName: TestSpaceName.name,
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe('getParamsForHandler', () => {
    it('should return new params from class pip', async () => {
      const params = ['1', '2'];
      const params2: [string, boolean] = ['1', true];
      const rpcTestClassInst = new RpcTestClass();
      const result = await handlerService.getParamsForHandler(
        rpcTestClassInst,
        'rpcTestMethode',
        params
      );

      expect(result).toEqual(params.map((i) => parseInt(i, 10)));

      const result2 = await handlerService.getParamsForHandler(
        rpcTestClassInst,
        'rpcTest2Methode',
        params2
      );
      expect(result2).toEqual([parseInt(params2[0], 10), params2[1]]);
    });

    it('should be error', async () => {
      const params = ['sdfsdf', '2'];
      const rpcTestClassInst = new RpcTestClass();
      expect.assertions(1);
      try {
        await handlerService.getParamsForHandler(
          rpcTestClassInst,
          'rpcTestMethode',
          params
        );
      } catch (e) {
        expect(e).toBeInstanceOf(RpcError);
      }
    });
  });

  describe('getPipeByType', () => {
    it('should return the pipe instance', async () => {
      const pipe = new ParseIntPipe();
      const result = await handlerService.getPipeByType(pipe);
      expect(result).toBeInstanceOf(ParseIntPipe);
    });

    it('should return the pipe from pipe type has in provider', async () => {
      const moduleRefGetSoy = jest.spyOn(moduleRef, 'get');
      const moduleRefCreateSoy = jest.spyOn(moduleRef, 'create');
      const result = await handlerService.getPipeByType(ParseIntPipe);
      expect(result).toBeInstanceOf(ParseIntPipe);
      expect(moduleRefCreateSoy).toHaveBeenCalledTimes(0);
      expect(moduleRefGetSoy).toHaveBeenCalledTimes(1);
    });

    it('should return the pipe from pipe type has not in provider', async () => {
      const moduleRefGetSoy = jest.spyOn(moduleRef, 'get');
      const moduleRefCreateSoy = jest.spyOn(moduleRef, 'create');
      const result = await handlerService.getPipeByType(ParseBoolPipe);
      expect(result).toBeInstanceOf(ParseBoolPipe);
      expect(moduleRefCreateSoy).toHaveBeenCalledTimes(1);
      expect(moduleRefGetSoy).toHaveBeenCalledTimes(1);
    });

    it('should return the pipe from pipe type has not in provider twice', async () => {
      const moduleRefGetSoy = jest.spyOn(moduleRef, 'get');
      const moduleRefCreateSoy = jest.spyOn(moduleRef, 'create');
      const result = await handlerService.getPipeByType(ParseBoolPipe);
      expect(result).toBeInstanceOf(ParseBoolPipe);
      const result2 = await handlerService.getPipeByType(ParseBoolPipe);
      expect(result2).toBeInstanceOf(ParseBoolPipe);
      expect(moduleRefCreateSoy).toHaveBeenCalledTimes(1);
      expect(moduleRefGetSoy).toHaveBeenCalledTimes(1);
    });
  });
});
