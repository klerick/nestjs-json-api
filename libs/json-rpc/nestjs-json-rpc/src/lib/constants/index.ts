import { ErrorCodeType } from '../types';

export const JsonRpcMetadataKey = '__rpc-metadata__';
export const JsonRpcMetadataKeyParamPipe = '__rpc-metadata-param-pipe__';

export const MAP_HANDLER = Symbol('MAP_HANDLER');
export const RPC_CONTEXT = Symbol('RPC_CONTEXT');
export const ASYNC_ITERATOR_FACTORY = Symbol('ASYNC_ITERATOR_FACTORY');
export const ZOD_INPUT_DATA = Symbol('ZOD_INPUT_DATA');

export const ErrorCode: Record<ErrorCodeType, number> = {
  [ErrorCodeType.ParseError]: -32700,
  [ErrorCodeType.InvalidRequest]: -32600,
  [ErrorCodeType.MethodNotFound]: -32601,
  [ErrorCodeType.InvalidParams]: -32602,
  [ErrorCodeType.InternalError]: -32603,
  [ErrorCodeType.ServerError]: -32000,
} as const;
