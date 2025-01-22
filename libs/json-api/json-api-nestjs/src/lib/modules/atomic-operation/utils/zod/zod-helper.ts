import {
  z,
  ZodArray,
  ZodLiteral,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodString,
  ZodType,
  ZodUnion,
} from 'zod';
import { camelToKebab } from '@klerick/json-api-nestjs-shared';

import { KEY_MAIN_INPUT_SCHEMA } from '../../constants';
import { MapController } from '../../types';
import { GetFieldForEntity, TupleOfEntityRelation } from '../../../mixin/types';
import { getEntityName } from '../../../mixin/helper';
import { ObjectLiteral } from '../../../../types';

export enum Operation {
  add = 'add',
  update = 'update',
  remove = 'remove',
}

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

const jsonSchema: ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

const zodGeneralData = jsonSchema.nullable();
type ZodGeneral = typeof zodGeneralData;

export type ZodAdd<T extends string> = ReturnType<typeof zodAdd<T>>;
export const zodAdd = <T extends string>(type: T) =>
  z
    .object({
      op: z.literal(Operation.add),
      ref: z
        .object({
          type: z.literal(type),
          tmpId: z.union([z.number(), z.string()]).optional(),
        })
        .strict(),
      data: zodGeneralData,
    })
    .strict();

export type ZodUpdate<T extends string> = ReturnType<typeof zodUpdate<T>>;
export const zodUpdate = <T extends string>(type: T) =>
  z
    .object({
      op: z.literal(Operation.update),
      ref: z
        .object({
          type: z.literal(type),
          id: z.string(),
        })
        .strict(),
      data: zodGeneralData,
    })
    .strict();
export type ZodRemove<T extends string> = ReturnType<typeof zodRemove<T>>;
export const zodRemove = <T extends string>(type: T) =>
  z
    .object({
      op: z.literal(Operation.remove),
      ref: z
        .object({
          type: z.literal(type),
          id: z.string(),
        })
        .strict(),
    })
    .strict();

export type ZodOperationRel<
  E extends ObjectLiteral,
  O extends Operation
> = ReturnType<typeof zodOperationRel<E, O>>;

export const zodOperationRel = <E extends ObjectLiteral, O extends Operation>(
  type: string,
  rel: TupleOfEntityRelation<E>,
  typeOperation: O
) => {
  const literalArray = rel.map((i) => z.literal(i)) as [
    ZodLiteral<string>,
    ZodLiteral<string>,
    ...ZodLiteral<string>[]
  ];

  return z
    .object({
      op: z.literal(typeOperation),
      ref: z
        .object({
          type: z.literal(type),
          id: z.string(),
          relationship: z.union(literalArray),
        })
        .strict(),
      data: zodGeneralData,
    })
    .strict();
};
export type ZodInputArray = ZodArray<
  ZodObject<{
    op: ZodLiteral<Operation>;
    ref: ZodObject<{
      type: ZodString;
      id: ZodOptional<ZodString>;
      relationship: ZodOptional<ZodString>;
      tmpId: ZodOptional<ZodUnion<[ZodNumber, ZodString]>>;
    }>;
    data: ZodOptional<ZodGeneral>;
  }>,
  'atleastone'
>;

export type ZodInputOperation<E extends ObjectLiteral = ObjectLiteral> =
  ReturnType<typeof zodInputOperation<E>>;
export type InputOperation<E extends ObjectLiteral> = z.infer<
  ZodInputOperation<E>
>;

export type InputArray = z.infer<ZodInputArray>;

export function zodInputOperation<E extends ObjectLiteral>(
  mapController: MapController<E>,
  getField: GetFieldForEntity<E>
) {
  const array = [] as unknown as [
    ZodAdd<string>,
    ZodUpdate<string>,
    ZodRemove<string>,
    ZodOperationRel<E, Operation.add>,
    ZodOperationRel<E, Operation.remove>,
    ZodOperationRel<E, Operation.update>
  ];
  for (const [entity, controller] of mapController.entries()) {
    const typeName = camelToKebab(getEntityName(entity));
    const { relations } = getField(entity);

    const hasOwnProperty = (props: string) =>
      Object.prototype.hasOwnProperty.call(controller.prototype, props);

    if (hasOwnProperty('postOne')) {
      array.push(zodAdd(typeName));
    }
    if (hasOwnProperty('patchOne')) {
      array.push(zodUpdate(typeName));
    }
    if (hasOwnProperty('deleteOne')) {
      array.push(zodRemove(typeName));
    }
    if (hasOwnProperty('postRelationship')) {
      array.push(zodOperationRel(typeName, relations, Operation.add));
    }
    if (hasOwnProperty('deleteRelationship')) {
      array.push(zodOperationRel(typeName, relations, Operation.remove));
    }
    if (hasOwnProperty('patchRelationship')) {
      array.push(zodOperationRel(typeName, relations, Operation.update));
    }
  }

  return z
    .object({
      [KEY_MAIN_INPUT_SCHEMA]: z.array(z.union(array)).nonempty(),
    })
    .strict();
}
