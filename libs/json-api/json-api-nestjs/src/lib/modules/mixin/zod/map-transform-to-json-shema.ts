import type { JSONSchema } from 'zod/v4/core';

export function transformDateString(i: string | null | undefined) {
  return i === null || i === undefined ? i : new Date(i);
}

export function transformStringToArray(input: string | undefined) {
  return input ? input.split(',') : undefined;
}

const mapTransformFunctionToJsonShema = new Map<string, JSONSchema.JSONSchema>([
  [
    transformDateString.name,
    {
      type: 'string',
      format: 'date-time',
      examples: [new Date().toISOString()],
    },
  ],
  [transformStringToArray.name, { type: 'array', items: { type: 'string' } }],
]);

export { mapTransformFunctionToJsonShema };
