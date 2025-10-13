import { z } from 'zod';

import { TypeForId } from '../../../../types';
import { nonEmptyObject } from '../zod-utils';

import { zodType, zodId } from './';

export function zodRelData<T extends string>(typeName: T, typeId: TypeForId) {
  return z
    .object({
      id: zodId(typeId),
      type: zodType(typeName),
    })
    .strict()
    .refine(nonEmptyObject);
}

export type ZodRelData<T extends string> = ReturnType<typeof zodRelData<T>>;
export type RelData<T extends string> = z.infer<ZodRelData<T>>;

export function zodData() {
  return z
    .object({
      type: z.string(),
      id: z.string(),
    })
    .strict()
    .refine(nonEmptyObject);
}

export type ZodData = ReturnType<typeof zodData>;
export type Data = z.infer<ZodData>;
