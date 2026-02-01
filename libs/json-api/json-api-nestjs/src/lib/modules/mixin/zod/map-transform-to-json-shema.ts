import type { JSONSchema } from 'zod/v4/core';

type DateStringTransform<
  Null extends true | false,
  isPatch extends true | false
> = isPatch extends true
  ?
    Null extends true ? Date | null | undefined : Date | undefined
  :
    Null extends true ? Date | null | undefined : Date;

export function transformDateString<
  Null extends true | false,
  isPatch extends true | false
>(i: string | null | undefined): DateStringTransform<Null, isPatch> {

  if (i === null || i === undefined) {
    return i as DateStringTransform<Null, isPatch>;
  }
  return new Date(i)
}

export function transformStringToArray(input: string | undefined) {
  return input ? input.split(',') : undefined;
}

export function transformFilterValueToString(r: string | null | number) {
  return `${r}`;
}

export function transformToNull() {
  return null;
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
  [transformFilterValueToString.name, { type: 'string' }],
  [transformToNull.name, { type: 'null' }],
]);

export { mapTransformFunctionToJsonShema };
