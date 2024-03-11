import { ErrorCode } from '../constants';
import { RpcErrorData, RpcErrorObject } from '../types/error-payloade';

export class RpcError extends Error {
  id: number | null = null;
  constructor(
    message: keyof typeof ErrorCode,
    public code: number,
    public data?: RpcErrorData
  ) {
    super(message);
  }
}

export function createError(
  type: keyof typeof ErrorCode,
  title?: string,
  description?: string
): RpcError {
  let data: undefined | RpcErrorData = undefined;
  if (title) {
    data = { title };
  }

  if (title && description) {
    data = { title, description };
  }

  return new RpcError(type, ErrorCode[type], data);
}

export function fromRpcErrorToRpcErrorObject(
  error: RpcError,
  id: null | number = null
): RpcErrorObject {
  return {
    jsonrpc: '2.0',
    error: {
      message: error.message,
      code: error.code,
      ...(error.data ? { data: error.data } : {}),
    },
    id: error.id ? error.id : id,
  };
}
