import { INestApplication } from '@nestjs/common';
import {
  ResultRpcFactoryPromise,
  ErrorCodeType,
  RpcError,
} from '@klerick/nestjs-json-rpc-sdk';

import { creatRpcSdk, MapperRpc, run } from '../utils/run-application';

let app: INestApplication;

beforeAll(async () => {
  app = await run();
});

afterAll(async () => {
  await app.close();
});

describe('Run json rpc:', () => {
  let rpc: ResultRpcFactoryPromise<MapperRpc>['rpc'];
  let rpcBatch: ResultRpcFactoryPromise<MapperRpc>['rpcBatch'];
  let rpcForBatch: ResultRpcFactoryPromise<MapperRpc>['rpcForBatch'];
  beforeEach(() => {
    ({ rpc, rpcBatch, rpcForBatch } = creatRpcSdk());
  });

  describe('Should be correct response', () => {
    it('Should be call one method', async () => {
      const input = 1;
      const result = await rpc.RpcService.someMethode(input);
      expect(result).toBe(input);
    });

    it('Should be correct response batch', async () => {
      const input = 1;
      const input2 = {
        a: 1,
        b: 2,
      };
      const call1 = rpcForBatch.RpcService.someMethode(input);
      const call2 = rpcForBatch.RpcService.methodeWithObjectParams(input2);

      const [result1, result2] = await rpcBatch(call1, call2);
      expect(result1).toBe(input);
      if ('error' in result2) {
        throw Error('Return error');
      }
      expect(result2.d).toEqual(`${input2.a}`);
      expect(result2.c).toEqual(`${input2.b}`);
    });
  });

  describe('Check error', () => {
    it('Should throw an error ' + ErrorCodeType.MethodNotFound, async () => {
      const input = 1;
      expect.assertions(6);
      try {
        // @ts-ignore
        await rpc.IncorrectService.incorrectMethode(input);
      } catch (e) {
        expect(e).toBeInstanceOf(RpcError);
        expect((e as RpcError).code).toBe(-32601);
        expect((e as RpcError).message).toBe(ErrorCodeType.MethodNotFound);
      }
      try {
        // @ts-ignore
        await rpc.RpcService.incorrectMethode(input);
      } catch (e) {
        expect(e).toBeInstanceOf(RpcError);
        expect((e as RpcError).code).toBe(-32601);
        expect((e as RpcError).message).toBe(ErrorCodeType.MethodNotFound);
      }
    });

    it('Should throw an error ' + ErrorCodeType.InvalidParams, async () => {
      const input = 'llll';
      expect.assertions(3);
      try {
        // @ts-ignore
        await rpc.RpcService.someMethode(input);
      } catch (e) {
        expect(e).toBeInstanceOf(RpcError);
        expect((e as RpcError).code).toBe(-32602);
        expect((e as RpcError).message).toBe(ErrorCodeType.InvalidParams);
      }
    });

    it('Should throw an error ' + ErrorCodeType.ServerError, async () => {
      const input = 5;
      expect.assertions(4);
      try {
        await rpc.RpcService.someMethode(input);
      } catch (e) {
        expect(e).toBeInstanceOf(RpcError);
        expect((e as RpcError).code).toBe(-32099);
        expect((e as RpcError).message).toBe(ErrorCodeType.ServerError);
        expect((e as RpcError).data.title).toBe('Custom Error');
      }
    });
  });
});
