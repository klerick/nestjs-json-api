import {
  z,
  ZodArray,
  ZodLiteral,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodString,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  ZodUnion,
} from 'zod';
import { ZodUnionOptions } from 'zod/lib/types';
import { DataSource } from 'typeorm';

import { KEY_MAIN_INPUT_SCHEMA } from '../../constants';
import { MapController } from '../../types';
import { UnionToTupleMain } from '../../../../types';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { camelToKebab, getEntityName } from '../../../../helper';
import { getField } from '../../../../helper/orm';

export enum Operation {
  add = 'add',
  update = 'update',
  remove = 'remove',
}

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

const jsonSchema: ZodType<Json, ZodTypeDef, Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

type ZodGeneral = ZodNullable<ZodType<Json, ZodTypeDef, Json>>;
const zodGeneralData: ZodGeneral = jsonSchema.nullable();

export type ZodAdd<T extends string> = ZodObject<{
  op: ZodLiteral<Operation.add>;
  ref: ZodObject<{
    type: ZodLiteral<T>;
    tmpId: ZodOptional<ZodUnion<[ZodNumber, ZodString]>>;
  }>;
  data: ZodGeneral;
}>;
export const zodAdd = <T extends string>(type: T): ZodAdd<T> =>
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

export type ZodUpdate<T extends string> = ZodObject<{
  op: ZodLiteral<Operation.update>;
  ref: ZodObject<{
    type: ZodLiteral<T>;
    id: ZodString;
  }>;
  data: ZodGeneral;
}>;
export const zodUpdate = <T extends string>(type: T): ZodUpdate<T> =>
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
export type ZodRemove<T extends string> = ZodObject<{
  op: ZodLiteral<Operation.remove>;
  ref: ZodObject<{
    type: ZodLiteral<T>;
    id: ZodString;
  }>;
}>;
export const zodRemove = <T extends string>(type: T): ZodRemove<T> =>
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

type RelToLiteralArray<Rel extends [string, ...string[]]> = UnionToTupleMain<
  {
    [K in Rel[number]]: ZodLiteral<K>;
  }[Rel[number]]
>;

type RelLiteralArrayToUnion<T> = T extends ZodUnionOptions
  ? ZodUnion<T>
  : never;

type ZodRelLiteral<Rel extends [string, ...string[]]> = RelLiteralArrayToUnion<
  RelToLiteralArray<Rel>
>;

export type ZodOperationRel<
  T extends string,
  Rel extends [string, ...string[]],
  OP extends Operation
> = ZodObject<{
  op: ZodLiteral<OP>;
  ref: ZodObject<{
    type: ZodLiteral<T>;
    id: ZodString;
    relationship: ZodRelLiteral<Rel>;
  }>;
  data: ZodGeneral;
}>;
export const zodOperationRel = <
  T extends string,
  R extends [string, ...string[]],
  OP extends Operation
>(
  type: T,
  rel: R,
  typeOperation: OP
): ZodOperationRel<T, R, OP> => {
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
          relationship: z.union(literalArray) as ZodRelLiteral<R>,
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
export type InputArray = z.infer<ZodInputArray>;

export type ZodInputOperation = ZodObject<
  {
    [KEY_MAIN_INPUT_SCHEMA]: ZodInputArray;
  },
  'strict'
>;

export const zodInputOperation = (
  dataSource: DataSource,
  mapController: MapController
): ZodInputOperation => {
  const array: [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]] = [] as any;
  for (const [entity, controller] of mapController.entries()) {
    type Entity = typeof entity;
    const repository = dataSource.getRepository<Entity>(
      entity as EntityTarget<Entity>
    );

    const typeName = camelToKebab(getEntityName(repository.target));
    const { relations } = getField(repository);

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
    .strict() as unknown as ZodInputOperation;
};
