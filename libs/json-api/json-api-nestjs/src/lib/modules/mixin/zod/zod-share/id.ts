import { z } from 'zod';
import { TypeField, TypeForId } from '../../../../types';

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

/**
 * JSON:API carries every id as a string, including ids of numeric primary keys.
 * A client-supplied id ends up written straight onto the new entity, so it has
 * to match the declared primary-key type: MikroORM 7 validates property types
 * on flush and rejects a string written to a numeric key, where earlier
 * versions coerced it silently.
 *
 * Only the resource's own id is converted. Relationship linkage ids keep their
 * string form -- they travel a different path and are matched as strings.
 */
export function zodPrimaryKeyId(typeId: TypeForId) {
  if (typeId === TypeField.number) {
    return zodId(typeId).transform((value) => Number(value));
  }

  return zodId(typeId);
}

export type ZodPrimaryKeyId = ReturnType<typeof zodPrimaryKeyId>;
