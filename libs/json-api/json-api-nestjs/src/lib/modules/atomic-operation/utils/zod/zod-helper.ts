import {
  getEntityName,
  RelationKeys,
  KEY_MAIN_INPUT_SCHEMA,
  Operation,
  AnyEntity,
  EntityClass,
} from '@klerick/json-api-nestjs-shared';
import {
  z,
  ZodArray,
  ZodLiteral,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodString,
  ZodUnion,
} from 'zod';
import { kebabCase } from 'change-case-commonjs';

import { MapController } from '../../types';

import { UnionToTuple } from '../../../../types';
import { EntityParamMap } from '../../../mixin/types';


const zodGeneralData = z.json().nullable();
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
          id: z.string().optional(),
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

export type ZodOperationRel<E extends object, O extends Operation> = ReturnType<
  typeof zodOperationRel<E, O>
>;

export const zodOperationRel = <E extends object, O extends Operation>(
  type: string,
  rel: UnionToTuple<RelationKeys<E>>,
  typeOperation: O
) => {
  const literalArray = rel.map((i) => z.literal(i as string)) as [
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
  }>
>;

export type ZodInputOperation<E extends object> = ReturnType<
  typeof zodInputOperation<E>
>;
export type InputOperation<E extends object> = z.infer<ZodInputOperation<E>>;

export type InputArray = z.infer<ZodInputArray>;

export function zodInputOperation<E extends object>(
  mapController: MapController<E>,
  entityMapProps: EntityParamMap<EntityClass<AnyEntity>>
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
    const typeName = kebabCase(getEntityName(entity));
    const entityMap = entityMapProps.get(entity as any);
    if (!entityMap) throw new Error('Entity not found in map');

    const { relations } = entityMap;

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
    if (hasOwnProperty('postRelationship') && relations.length > 0) {
      array.push(zodOperationRel(typeName, relations, Operation.add));
    }
    if (hasOwnProperty('deleteRelationship') && relations.length > 0) {
      array.push(zodOperationRel(typeName, relations, Operation.remove));
    }
    if (hasOwnProperty('patchRelationship') && relations.length > 0) {
      array.push(zodOperationRel(typeName, relations, Operation.update));
    }
  }

  return z
    .object({
      [KEY_MAIN_INPUT_SCHEMA]: z.array(z.union(array)).nonempty(),
    })
    .strict();
}
