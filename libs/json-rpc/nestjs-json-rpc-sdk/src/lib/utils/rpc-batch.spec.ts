import { RpcBatchFactory, RpcBatchFactoryPromise } from './rpc-batch';
import { WrapperCall } from './wrapper-call';
import { RpcError } from '../types';
import { lastValueFrom, of } from 'rxjs';

describe('rpc-batch', () => {
  it('RpcBatchFactory', async () => {
    const transport = vi.fn().mockImplementationOnce((data) => {
      expect(data.map((i: any) => i.id)).toEqual([1, 2, 3]);
      const errorObj = {
        error: {
          message: 'ErrroMsg',
          code: 1,
        },
        id: 3,
      };
      return of(
        data.map((i: any) => {
          if (i.id === 3) {
            return errorObj;
          } else {
            return {
              result: i.params,
              id: i.id,
            };
          }
        })
      );
    });
    const rpcBatch = RpcBatchFactory(transport);
    const call1 = new WrapperCall(
      'TestSpace',
      'TestMethod',
      [1, 2],
      transport
    ) as any;
    const call2 = new WrapperCall(
      'TestSpace1',
      'TestMethod1',
      [2],
      transport
    ) as any;
    const call3 = new WrapperCall(
      'TestSpace2',
      'TestMethod2',
      [3],
      transport
    ) as any;

    const result = await lastValueFrom(rpcBatch(call3, call1, call2))
    const [r3, r1, r2] = result;
    expect(r3).toBeInstanceOf(RpcError);
    expect(r2).toEqual(call2.arg);
    expect(r1).toEqual(call1.arg);


  });

  it('RpcBatchFactoryPromise', async () => {
    const transport = vi.fn().mockImplementationOnce((data) => {
      expect(data.map((i: any) => i.id)).toEqual([4, 5, 6]);
      const errorObj = {
        error: {
          message: 'ErrroMsg',
          code: 1,
        },
        id: 6,
      };
      return of(
        data.map((i: any) => {
          if (i.id === 6) {
            return errorObj;
          } else {
            return {
              result: i.params,
              id: i.id,
            };
          }
        })
      );
    });
    const rpcBatch = RpcBatchFactoryPromise(transport);
    const call1 = new WrapperCall(
      'TestSpace',
      'TestMethod',
      [1, 2],
      transport
    ) as any;
    const call2 = new WrapperCall(
      'TestSpace1',
      'TestMethod1',
      [2],
      transport
    ) as any;
    const call3 = new WrapperCall(
      'TestSpace2',
      'TestMethod2',
      [3],
      transport
    ) as any;

    const [r3, r1, r2] = await rpcBatch(call3, call1, call2);
    expect(r3).toBeInstanceOf(RpcError);
    expect(r2).toEqual(call2.arg);
    expect(r1).toEqual(call1.arg);
  });
});
