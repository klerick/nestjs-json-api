import { z } from 'zod';

import { zVersion } from './payloade';

const zRpcIdError = z.union([z.number(), z.null()]);
const zRpcErrorData = z.object({
  title: z.string(),
  description: z.string().optional(),
});
const zRpcError = z.object({
  message: z.string(),
  code: z.number(),
  data: zRpcErrorData.optional(),
});

export const ZRpcError = z.object({
  jsonrpc: zVersion,
  error: zRpcError,
  id: zRpcIdError,
});

export type RpcErrorObject = z.infer<typeof ZRpcError>;
export type RpcErrorData = z.infer<typeof zRpcErrorData>;
