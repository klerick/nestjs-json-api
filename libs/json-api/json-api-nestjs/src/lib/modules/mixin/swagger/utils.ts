import { ApiProperty } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import {
  ObjectTyped,
  EntityRelation,
  camelToKebab,
} from '../../../utils/nestjs-shared';

import { EntityProps, TypeField, ZodEntityProps, ZodParams } from '../types';
import { EntityClass, ObjectLiteral } from '../../../types';

export const errorSchema = {
  type: 'object',
  properties: {
    statusCode: {
      type: 'number',
    },
    error: {
      type: 'string',
    },
    message: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
          },
          message: {
            type: 'string',
          },
          path: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          keys: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['code', 'message', 'path'],
      },
    },
  },
};

export function jsonSchemaResponse<E extends ObjectLiteral>(
  entity: EntityClass<E>,
  mapEntity: Map<EntityClass<E>, ZodEntityProps<E>>,
  array = false
) {
  const { propsType, relations, relationProperty, primaryColumnName } =
    getEntityMapProps(mapEntity, entity);

  const dataType = {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        const: camelToKebab(entity.name),
      },
      id: {
        type: 'string',
      },
      attributes: {
        type: 'object',
        properties: ObjectTyped.entries(propsType)
          .filter(([name]) => name !== primaryColumnName)
          .reduce((acum, [name, type]) => {
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
        properties: relations.reduce((acum, name) => {
          const dataItem = {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                const: getEntityMapProps(
                  mapEntity,
                  Reflect.get(relationProperty, name).entityClass
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
          acum[name.toString()] = {
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

export function createApiModels<E extends ObjectLiteral>(
  entity: EntityClass<E>,
  mapEntity: ZodEntityProps<E>
): EntityClass<E> {
  const { propsType, props, relations, propsNullable, relationProperty } =
    mapEntity;

  for (const name of props) {
    let currentType: any;
    let required = false;
    let isArray = false;
    required = !(propsNullable as any).includes(name);
    const type = Reflect.get(propsType, name);
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
    if (relations.includes(name as string)) {
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

export function getEntityMapProps<E extends ObjectLiteral>(
  mapEntity: Map<EntityClass<E>, ZodEntityProps<E>>,
  entity: EntityClass<E>
) {
  const entityMap = mapEntity.get(entity);
  if (!entityMap) throw new Error('Entity not found in map');
  return entityMap;
}
