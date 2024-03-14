import { lastValueFrom } from 'rxjs';

import { LoopFunc, RpcReturnList, Transport } from '../types';
import { WrapperCall } from './wrapper-call';

export const rpcProxy = <T extends RpcReturnList<any, boolean>>(
  transport: Transport<LoopFunc>,
  usePromise = false
): T => {
  const mockRpcNameSpace = {} as T;
  return new Proxy<T>(mockRpcNameSpace, {
    get(target, nameSpace: keyof T) {
      const mockRpcmethode = {} as T[typeof nameSpace];
      return new Proxy<T[typeof nameSpace]>(mockRpcmethode, {
        get(target, method: keyof T[typeof nameSpace]) {
          return <T extends LoopFunc>(...arg: Parameters<T>) => {
            const wr = new WrapperCall(
              String(nameSpace),
              String(method),
              arg,
              transport
            );
            if (usePromise) return lastValueFrom(wr);
            return wr;
          };
        },
      });
    },
  });
};
