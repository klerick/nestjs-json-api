import { AxiosStatic, AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

import {
  HttpAgentFactory,
  LoopFunc,
  PayloadRpc,
  ReturnTransportCall,
  RpcResult,
} from '../types';
import { map } from 'rxjs/operators';

export function axiosTransportFactory<T extends LoopFunc>(
  axios: AxiosStatic
): HttpAgentFactory<T> {
  return (url: string) => (body: PayloadRpc<T>) => {
    const controller = new AbortController();
    const signal = controller.signal;

    return new Observable<AxiosResponse<RpcResult<T>>>((subscriber) => {
      axios
        .post<
          ReturnTransportCall<T>,
          AxiosResponse<RpcResult<T>, PayloadRpc<T>>,
          PayloadRpc<T>
        >(url, body, { signal })
        .then((response) => subscriber.next(response))
        .catch((error: unknown) => subscriber.error(error))
        .finally(() => subscriber.complete());

      return { unsubscribe: () => controller.abort() };
    }).pipe(map((r) => r.data));
  };
}
