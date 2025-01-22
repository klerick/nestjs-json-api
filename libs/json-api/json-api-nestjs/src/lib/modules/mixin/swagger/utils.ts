import { ApiProperty } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import {
  ObjectTyped,
  EntityRelation,
  camelToKebab,
} from '@klerick/json-api-nestjs-shared';

import { EntityProps, TypeField, ZodParams } from '../types';
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
  zodParams: ZodParams<E, EntityProps<E>, string>,
  array = false
) {
  const {
    entityFieldsStructure,
    fieldWithType,
    relationArrayProps,
    relationPopsName,
    primaryColumn,
  } = zodParams;
  const { relations } = entityFieldsStructure;

  const relationTypeName = relationPopsName;

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
        properties: ObjectTyped.entries(fieldWithType)
          .filter(([name]) => name !== primaryColumn)
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
                const: camelToKebab(
                  relationTypeName[name as EntityRelation<E>]
                ),
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
              data: relationArrayProps[name as EntityRelation<E>]
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
  zodParams: ZodParams<E, EntityProps<E>, string>
): EntityClass<E> {
  const {
    entityFieldsStructure,
    propsType,
    relationPopsName,
    propsDb,
    relationArrayProps,
  } = zodParams;

  for (const [name, type] of ObjectTyped.entries(propsType)) {
    const { field, relations } = entityFieldsStructure;
    let currentType: any;
    let required = false;
    let isArray = false;
    if (field.includes(name as string)) {
      required = !propsDb[name].isNullable;
      isArray = propsDb[name].isArray;
      switch (propsType[name as EntityProps<E>]) {
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
    }

    if (relations.includes(name as string)) {
      currentType = relationPopsName[name as EntityRelation<E>];
      if (propsDb[name]) {
        required = !propsDb[name].isNullable;
        isArray = propsDb[name].isArray;
      } else {
        isArray = relationArrayProps[name as EntityRelation<E>];
        required = !isArray;
      }
    }

    ApiProperty({
      required,
      isArray,
      type: () => currentType,
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
