import { z, ZodString } from 'zod';
import { TypeField, TypeForId } from '../../orm';

const reg = new RegExp('^-?\\d+$');

export type ZodIdSchema = ZodString;
export const zodIdSchema = (typeId: TypeForId): ZodIdSchema => {
  let idSchema = z.string();
  if (typeId === TypeField.number) {
    idSchema = idSchema.regex(reg);
  }

  return idSchema;
};
