import { ErrorCode } from '../constants';
import { RpcErrorData, RpcErrorObject } from '../types';
import { ErrorCodeType } from '../types';

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

function getErrorData(
  title?: string,
  description?: string
): undefined | RpcErrorData {
  let data: undefined | RpcErrorData = undefined;
  if (title) {
    data = { title };
  }

  if (title && description) {
    data = { title, description };
  }
  return data;
}

export function createErrorCustomError(
  code: number,
  title?: string,
  description?: string
): RpcError {
  const absCode = Math.abs(code);
  let resultCode = 3200;
  if (code < 0 && absCode > 3200 && absCode <= 32099) {
    resultCode = code;
  }

  return new RpcError(
    ErrorCodeType.ServerError,
    resultCode,
    getErrorData(title, description)
  );
}
export function createError(
  type: keyof typeof ErrorCode,
  title?: string,
  description?: string
): RpcError {
  return new RpcError(type, ErrorCode[type], getErrorData(title, description));
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

export function getBodyError(exception: Error): RpcErrorObject {
  if (exception instanceof RpcError) {
    return fromRpcErrorToRpcErrorObject(exception);
  }
  return fromRpcErrorToRpcErrorObject(
    createError(ErrorCodeType.ServerError, exception.message)
  );
}
