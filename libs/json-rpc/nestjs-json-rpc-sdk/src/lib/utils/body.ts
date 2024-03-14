import { LoopFunc, PayloadRpc } from '../types';
import { JSON_RPC_VERSION } from '../constans';

export function generateBodyMethod(nameSpace: string, method: string): string {
  return `${nameSpace}.${method}`;
}

export function generateBody<T extends LoopFunc>(
  method: string,
  params: Parameters<T>,
  id: number
): PayloadRpc<T> {
  return {
    jsonrpc: JSON_RPC_VERSION,
    params,
    method,
    id,
  };
}
