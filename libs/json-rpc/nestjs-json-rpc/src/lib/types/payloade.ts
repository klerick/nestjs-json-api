import { z } from 'zod';

const zParams = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.json(),
]);

export const zVersion = z.literal('2.0');
const zMethod = z.string().transform((params, ctx) => {
  const result = params.split('.');
  if (result.length !== 2) {
    ctx.addIssue({
      code: 'custom',
      message: 'Not a 2 items',
    });
    return z.NEVER;
  }
  return {
    spaceName: result[0],
    methodName: result[1],
  };
});

const zRpcParams = z
  .union([z.array(zParams), z.record(z.string(), zParams)])
  .transform((params) =>
    Array.isArray(params) ? params : Object.values(params)
  );

const zRpcId = z.union([
  z.string().regex(/^\d+$/).transform(Number),
  z.number(),
]);

export const ZPayloadRpc = z.object({
  jsonrpc: zVersion,
  method: zMethod,
  params: zRpcParams,
  id: zRpcId,
});

export const ZPayloadRpcArray = z.array(ZPayloadRpc).min(1);

export const ZPayloadRpcData = z.union([ZPayloadRpc, ZPayloadRpcArray]);

export type ZodPayloadRpc = typeof ZPayloadRpc;

export type PayloadRpc = z.infer<typeof ZPayloadRpc>;
export type PayloadRpcArray = z.infer<typeof ZPayloadRpcArray>;
export type PayloadRpcData = z.infer<typeof ZPayloadRpcData>;

export const ZRpcResult = z.object({
  jsonrpc: zVersion,
  result: zRpcParams,
  id: z.union([zRpcId, z.null()]),
});

export type RpcResult = z.infer<typeof ZRpcResult>;
