/**
 * JSON-RPC 2.0: WebSocket Transport Protocol Integration
 *
 * This test suite demonstrates JSON-RPC 2.0 protocol implementation over WebSocket transport.
 * WebSocket provides bidirectional, full-duplex communication for real-time RPC operations.
 * It verifies that standard JSON-RPC requests, batch operations, and error handling work
 * correctly over persistent WebSocket connections.
 *
 * Examples include:
 * - Single method invocations over WebSocket connection
 * - Batch requests (multiple method calls in a single WebSocket message)
 * - Error handling for MethodNotFound, InvalidParams, and ServerError
 * - Type-safe RPC client usage with TypeScript
 * - Connection lifecycle management and cleanup
 */

import {
  ResultRpcFactoryPromise,
  ErrorCodeType,
  RpcError,
} from '@klerick/nestjs-json-rpc-sdk';

import {
  creatWsRpcSdk,
  MapperRpc,
  destroySubject,
} from '../utils/run-application';

afterAll(async () => {
  destroySubject.next(true);
  destroySubject.complete();
});

describe('JSON-RPC 2.0 over WebSocket', () => {
  let rpc: ResultRpcFactoryPromise<MapperRpc>['rpc'];
  let rpcBatch: ResultRpcFactoryPromise<MapperRpc>['rpcBatch'];
  let rpcForBatch: ResultRpcFactoryPromise<MapperRpc>['rpcForBatch'];
  beforeEach(() => {
    ({ rpc, rpcBatch, rpcForBatch } = creatWsRpcSdk());
  });

  describe('Successful RPC Calls', () => {
    it('should invoke a single RPC method and return the correct result', async () => {
      const input = 1;
      const result = await rpc.RpcService.someMethode(input);
      expect(result).toBe(input);
    });

    it('should execute multiple RPC methods in a single batch request', async () => {
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

  describe('Error Handling', () => {
    it('should return MethodNotFound error (-32601) when calling non-existent service or method', async () => {
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

    it('should return InvalidParams error (-32602) when providing incorrect parameter types', async () => {
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

    it('should return ServerError (-32099) with custom error data when method throws an exception', async () => {
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
