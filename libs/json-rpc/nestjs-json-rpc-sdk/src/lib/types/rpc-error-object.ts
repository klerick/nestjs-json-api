import { JsonRpcVersion } from './rpc';

export enum ErrorCodeType {
  ParseError = 'Parse error',
  InvalidRequest = 'Invalid request',
  MethodNotFound = 'Method not found',
  InvalidParams = 'Invalid params',
  InternalError = 'Internal error',
  ServerError = 'Server error',
}

export type RpcErrorObject = {
  jsonrpc: JsonRpcVersion;
  error: {
    message: ErrorCodeType | string;
    code: number;
    data?: {
      title: string;
      description: string;
    };
  };
  id: null | number;
};

export class RpcError extends Error {
  data!: {
    title: string;
    description: string;
  };
  code!: number;
  id: null | number = null;
  constructor(rpcError: RpcErrorObject) {
    super(rpcError.error.message);
    this.id = rpcError.id;
    this.code = rpcError.error.code;
    if (rpcError.error.data) {
      this.data = rpcError.error.data;
    }
  }
}
