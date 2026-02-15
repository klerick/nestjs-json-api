import { ApiProperty } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import {
  ObjectTyped,
  EntityClass,
  AttrKeys,
} from '@klerick/json-api-nestjs-shared';
import { kebabCase } from 'change-case-commonjs';

import { EntityParam, TypeField } from '../../../types';

import { EntityParamMapService } from '../service';
import { toJSONSchema, ZodType } from 'zod';
import { mapTransformFunctionToJsonShema } from '../zod';
import { ReferenceObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import {
  zodFieldSelectRule,
} from '../zod/zod-input-query-schema/fields';
import {
  zodRulesForFilterOperator,
  zodRulesForRelation,
} from '../zod/zod-input-query-schema/filter';
import { zodPatchRelationship, zodRelationshipData, zodMeta } from '../zod';
import { zodGeneralData } from '../../atomic-operation/utils';

export function assertIsKeysOfObject<E extends object>(
  object: EntityClass<E>,
  element: any
): asserts element is readonly [keyof E] {
  if (!Array.isArray(element)) {
    throw new Error(element + ' is not keys of ' + object.name);
  }
  if (false) throw new Error(element + ' not exist in ' + object.name);
}

export function assertIsKeyOfObject<E extends object>(
  object: EntityClass<E>,
  element: unknown
): asserts element is AttrKeys<E> {
  if (false) throw new Error(element + 'not exist in ' + object.name);
}

const jsonApiLinksRef = { $ref: '#/components/schemas/ZodSchemaRef/properties/JsonApiLinks' };

function getOrCreateEntityDataItem<E extends object, IdKey extends string>(
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>
): { $ref: string } {
  const schemaName = `${entity.name}DataItem`;
  const refPath = `#/components/schemas/ZodSchemaRef/properties/${schemaName}`;

  if (schemaName in ZodSchemaRef.prototype) {
    return { $ref: refPath };
  }

  const { propsType, relations, relationProperty, primaryColumnName } =
    mapEntity.getParamMap(entity);

  assertIsKeysOfObject(entity, relations);

  const dataTypeSchema = {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        const: kebabCase(entity.name),
      },
      id: {
        type: 'string',
      },
      attributes: {
        type: 'object',
        properties: ObjectTyped.entries(propsType)
          .filter(([name]) => name !== primaryColumnName)
          .reduce((acum, [name, type]) => {
            assertIsKeyOfObject(entity, name);
            switch (type) {
              case TypeField.array:
                acum[name.toString()] = {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                };
                break;
              case TypeField.date:
                acum[name.toString()] = {
                  format: 'date-time',
                  type: 'string',
                };
                break;
              case TypeField.number:
                acum[name.toString()] = {
                  type: 'integer',
                };
                break;
              case TypeField.boolean:
                acum[name.toString()] = {
                  type: 'boolean',
                };
                break;
              default:
                acum[name.toString()] = {
                  type: 'string',
                };
            }
            return acum;
          }, {} as Record<string, SchemaObject>),
      },
      relationships: {
        type: 'object',
        properties: ObjectTyped.keys(
          relationProperty
        ).reduce((acum, name) => {
          const relDataItem = {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                const: mapEntity.getParamMap(
                  Reflect.get(relationProperty, name).entityClass as any
                ).typeName,
              },
              id: {
                type: 'string',
              },
            },
            required: ['type', 'id'],
          };
          const relDataArray = {
            type: 'array',
            items: relDataItem,
          };
          acum[name] = {
            type: 'object',
            properties: {
              links: jsonApiLinksRef,
              data: Reflect.get(relationProperty, name).isArray
                ? relDataArray
                : relDataItem,
            },
            required: ['links'],
          };
          return acum;
        }, {} as Record<string, SchemaObject>),
      },
      links: jsonApiLinksRef,
    },
  };

  ApiProperty(dataTypeSchema as any)(ZodSchemaRef.prototype, schemaName);

  return { $ref: refPath };
}

export function jsonSchemaResponse<
  E extends object,
  IdKey extends string = 'id'
>(
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>,
  array = false
) {
  const dataItemRef = getOrCreateEntityDataItem(entity, mapEntity);

  const dataSchema = array
    ? { type: 'array', items: dataItemRef }
    : dataItemRef;

  return {
    type: 'object',
    properties: {
      meta: {
        type: 'object',
      },
      data: dataSchema,
      includes: jsonApiIncludesRef,
    },
    required: ['meta', 'data'],
  };
}

export function createApiModels<E extends object>(
  entity: EntityClass<E>,
  mapEntity: EntityParam<E>
): EntityClass<E> {
  const { propsType, props, relations, propsNullable, relationProperty } =
    mapEntity;
  assertIsKeysOfObject(entity, propsNullable);
  assertIsKeysOfObject(entity, relations);

  for (const name of props) {
    let currentType: any;
    let required = false;
    let isArray = false;

    assertIsKeyOfObject(entity, name);

    required = !propsNullable.includes(name);

    const type = propsType[name];
    isArray = type === 'array';
    switch (type) {
      case TypeField.date:
        currentType = Date;
        break;
      case TypeField.number:
        currentType = Number;
        break;
      case TypeField.boolean:
        currentType = Boolean;
        break;
      default:
        currentType = String;
    }
    if (relations.includes(name)) {
      const propsRel = Reflect.get(relationProperty, name);
      currentType = propsRel.entityClass;
      isArray = propsRel.isArray;
    }

    ApiProperty({
      required,
      isArray,
      type: () => currentType,
    })(entity.prototype, name.toString());
  }

  for (const name of relations) {
    const propsRel = Reflect.get(relationProperty, name);
    ApiProperty({
      required: !propsRel.nullable,
      isArray: propsRel.isArray,
      type: propsRel.entityClass,
    })(entity.prototype, name.toString());
  }

  return entity;
}

const dataType = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
    },
    id: {
      type: 'string',
    },
  },
};
export const schemaTypeForRelation = {
  type: 'object',
  properties: {
    data: {
      oneOf: [
        dataType,
        { type: 'null' },
        {
          type: 'array',
          items: dataType,
        },
      ],
    },
  },
};

export const zodToJSONSchemaParams: Parameters<typeof toJSONSchema>[1] = {
  target: 'draft-2020-12',
  unrepresentable: 'any',
  reused: 'inline',
  override(ctx) {
    const def = ctx.zodSchema._zod.def;

    if (!def || !def?.type) return;
    if (def.type === 'transform') {
      const shema = mapTransformFunctionToJsonShema.get(def.transform.name);
      if (!shema) return;
      Object.assign(ctx.jsonSchema, shema);
    }
  },
};

function resolveDefsInSchema(
  schema: Record<string, unknown>,
  defs?: Record<string, unknown>,
  resolving = new Set<string>()
): Record<string, unknown> {
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map((item) =>
      resolveDefsInSchema(item as Record<string, unknown>, defs, resolving)
    ) as unknown as Record<string, unknown>;
  }

  const effectiveDefs = defs ?? (schema['$defs'] as Record<string, unknown> | undefined);

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (key === '$defs') {
      continue;
    }

    if (key === '$ref' && typeof value === 'string' && value.startsWith('#/$defs/')) {
      const defName = value.replace('#/$defs/', '');

      if (!defName.startsWith('__')) {
        return { $ref: `#/components/schemas/ZodSchemaRef/properties/${defName}` };
      }

      if (resolving.has(defName)) {
        return {};
      }
      const defSchema = effectiveDefs?.[defName];
      if (defSchema && typeof defSchema === 'object') {
        resolving.add(defName);
        const resolved = resolveDefsInSchema(
          defSchema as Record<string, unknown>,
          effectiveDefs,
          resolving
        );
        resolving.delete(defName);
        return resolved;
      }
      return {};
    }

    if (typeof value === 'object' && value !== null) {
      result[key] = resolveDefsInSchema(
        value as Record<string, unknown>,
        effectiveDefs,
        resolving
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

const jsonApiLinksSchema = {
  type: 'object',
  properties: {
    self: { type: 'string' },
  },
  required: ['self'],
};

const jsonApiIncludesSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      type: { type: 'string' },
      id: { type: 'string' },
      attributes: { type: 'object' },
      relationships: {
        type: 'object',
        properties: {
          relationName: {
            properties: {
              links: { $ref: '#/components/schemas/ZodSchemaRef/properties/JsonApiLinks' },
            },
            required: ['links'],
          },
        },
      },
      links: { $ref: '#/components/schemas/ZodSchemaRef/properties/JsonApiLinks' },
    },
    required: ['type', 'id', 'attributes'],
  },
};
const jsonApiIncludesRef = { $ref: '#/components/schemas/ZodSchemaRef/properties/JsonApiIncludes' };

function registerZodSchemas(target: { prototype: object }, schemas: ZodType[]): void {
  for (const schema of schemas) {
    const metaId = schema.meta()?.id;
    if (!metaId) continue;

    if (metaId in target.prototype) continue;


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { $schema: _, ...rest } = toJSONSchema(schema, {
      ...zodToJSONSchemaParams,
      reused: 'ref',
    }) as Record<string, unknown>;

    const jsonSchema = resolveDefsInSchema(rest);
    Object.defineProperty(target.prototype, metaId, {
      value: undefined,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    Reflect.defineMetadata('design:type', Object, target.prototype, metaId);
    ApiProperty(jsonSchema as any)(target.prototype, metaId);
  }
}

export class ZodSchemaRef {
  @ApiProperty(jsonApiLinksSchema as any)
  JsonApiLinks!: unknown;

  @ApiProperty(jsonApiIncludesSchema as any)
  JsonApiIncludes!: unknown;

  @ApiProperty(schemaTypeForRelation as any)
  RelationshipResponse!: unknown;
}

export const schemaTypeForRelationRef = { $ref: '#/components/schemas/ZodSchemaRef/properties/RelationshipResponse' };

let zodSchemasRegistered = false;

export function ensureZodSchemasRegistered(): void {
  if (zodSchemasRegistered) return;
  zodSchemasRegistered = true;

  registerZodSchemas(ZodSchemaRef, [
    zodFieldSelectRule,
    zodRulesForFilterOperator,
    zodRulesForRelation,
    zodPatchRelationship,
    zodRelationshipData,
    zodGeneralData,
    zodMeta,
  ]);
}

export function zodToOpenApiSchema<T extends ZodType>(
  schema: T,
  params: Parameters<typeof toJSONSchema>[1] = zodToJSONSchemaParams
): SchemaObject | ReferenceObject {
  const metaId = schema.meta()?.id;
  if (metaId) {
    return { $ref: `#/components/schemas/ZodSchemaRef/properties/${metaId}` };
  }

  const refParams = { ...params, reused: 'ref' as const };
  const { $schema: _, $defs, ...rest } = toJSONSchema(schema, refParams) as Record<string, unknown>;

  if ($defs && typeof $defs === 'object') {
    return resolveDefsInSchema(rest, $defs as Record<string, unknown>) as
      | SchemaObject
      | ReferenceObject;
  }

  return rest as SchemaObject | ReferenceObject;
}
