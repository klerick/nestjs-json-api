import { fromFetch } from 'rxjs/fetch';
import { LoopFunc, PayloadRpc, RpcResult, Transport } from '../types';

export function fetchTransportFactory<T extends LoopFunc>(
  url: string
): Transport<T> {
  return (body: PayloadRpc<T>) =>
    fromFetch<RpcResult<T>>(url, {
      method: 'post',
      body: JSON.stringify(body),
      selector: (r) => r.json(),
    });
}
