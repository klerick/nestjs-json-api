import { Observable, of } from 'rxjs';

import { rpcProxy } from './rpc-proxy';
import { LoopFunc, RpcReturnList, Transport } from '../types';

interface TestRpc {
  test(a: number, b: number): Promise<number>;
}

type MapRpc = {
  TestRpc: TestRpc;
};

describe('rpc-proxy', () => {
  it('should be return Observable', () => {
    const arg: [number, number] = [1, 2];
    const resultRpc = 1;
    const transport = vi.fn().mockImplementationOnce((data) => ({
      result: resultRpc,
      id: data.id,
    })) as Transport<LoopFunc>;
    const usePromise = false;
    const rpc = rpcProxy<RpcReturnList<MapRpc, false>>(transport, usePromise);
    expect(rpc.TestRpc).not.toBe(undefined);
    expect(rpc.TestRpc.test).not.toBe(undefined);
    const result = rpc.TestRpc.test(...arg);
    expect(result).toBeInstanceOf(Observable);
  });

  it('should be return Promise', async () => {
    const arg: [number, number] = [1, 2];
    const resultRpc = 1;
    const transport = vi.fn().mockImplementationOnce((data) =>
      of({
        result: resultRpc,
        id: data.id,
      })
    ) as Transport<LoopFunc>;
    const usePromise = true;
    const rpc = rpcProxy<RpcReturnList<MapRpc, true>>(transport, usePromise);
    expect(rpc.TestRpc).not.toBe(undefined);
    expect(rpc.TestRpc.test).not.toBe(undefined);
    const result = rpc.TestRpc.test(...arg);
    expect(result).toBeInstanceOf(Promise);
    const resultRpcCheck = await result;
    expect(resultRpcCheck).toBe(resultRpc);
  });
});
