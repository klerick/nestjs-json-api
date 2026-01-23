import { ApiProperty } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import {
  ObjectTyped,
  AnyEntity,
  EntityClass,
  AttrKeys,
} from '@klerick/json-api-nestjs-shared';
import { kebabCase } from 'change-case-commonjs';

import { EntityParam, RelationProperty, TypeField } from '../../../types';

import { EntityParamMap } from '../types';
import { EntityParamMapService } from '../service';
import { toJSONSchema } from 'zod';
import { mapTransformFunctionToJsonShema } from '../zod';

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

export function jsonSchemaResponse<
  E extends object,
  IdKey extends string = 'id'
>(
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>,
  array = false
) {
  const { propsType, relations, relationProperty, primaryColumnName } =
    mapEntity.getParamMap(entity);

  assertIsKeysOfObject(entity, relations);
  const dataType = {
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
          const dataItem = {
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
          const dataArray = {
            type: 'array',
            items: dataItem,
          };
          acum[name] = {
            type: 'object',
            properties: {
              links: {
                type: 'object',
                properties: {
                  self: {
                    type: 'string',
                  },
                },
                required: ['self'],
              },
              data: Reflect.get(relationProperty, name).isArray
                ? dataArray
                : dataItem,
            },
            required: ['links'],
          };
          return acum;
        }, {} as Record<string, SchemaObject>),
      },
      links: {
        type: 'object',
        properties: {
          self: {
            type: 'string',
          },
        },
        required: ['self'],
      },
    },
  };
  const dataTypeArra = {
    type: 'array',
    items: dataType,
  };
  return {
    type: 'object',
    properties: {
      meta: {
        type: 'object',
      },
      data: array ? dataTypeArra : dataType,
      includes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
            },
            id: {
              type: 'string',
            },
            attributes: {
              type: 'object',
            },
            relationships: {
              type: 'object',
              properties: {
                relationName: {
                  properties: {
                    links: {
                      type: 'object',
                      properties: {
                        self: {
                          type: 'string',
                        },
                      },
                      required: ['self'],
                    },
                  },
                  required: ['links'],
                },
              },
            },
            links: {
              type: 'object',
              properties: {
                self: {
                  type: 'string',
                },
              },
              required: ['self'],
            },
          },
          required: ['type', 'id', 'attributes'],
        },
      },
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

export function getEntityMapProps<E extends object>(
  mapEntity: EntityParamMap<EntityClass<AnyEntity>>,
  entity: EntityClass<E>
) {
  const entityMap = mapEntity.get(entity);
  if (!entityMap) throw new Error('Entity not found in map');
  return entityMap;
}


export const zodToJSONSchemaParams: Parameters<typeof toJSONSchema>[1] = {
  unrepresentable: 'any',
  override(ctx){
    const def = ctx.zodSchema._zod.def

    if (!def || !def?.type) return
    if (def.type === 'transform'){
      const shema = mapTransformFunctionToJsonShema.get(def.transform.name)
      if (!shema) return;
      Object.assign(ctx.jsonSchema, shema)
    }
  }
}
