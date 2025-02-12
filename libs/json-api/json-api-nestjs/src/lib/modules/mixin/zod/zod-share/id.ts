import { z } from 'zod';
import { TypeField, TypeForId } from '../../types';

const reg = new RegExp('^-?\\d+$');

export function zodId(typeId: TypeForId) {
  let idSchema = z.string();
  if (typeId === TypeField.number) {
    idSchema = idSchema.regex(reg);
  }

  return idSchema;
}

export type ZodId = ReturnType<typeof zodId>;
export type Id = z.infer<ZodId>;
