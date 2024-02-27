import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { DeepPartial } from 'typeorm/common/DeepPartial';
import { Repository } from 'typeorm';

import {
  getField,
  getFieldWithType,
  TypeField,
  getIsArrayRelation,
  getRelationTypeName,
} from '../orm';
import { camelToKebab, nameIt, ObjectTyped } from '../utils';
import { Entity, EntityRelation } from '../../types';

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

export function jsonSchemaResponse<E extends Entity>(
  repository: Repository<E>,
  array = false
) {
  const { relations } = getField(repository);
  const fieldTypes = getFieldWithType(repository);
  const arrayField = getIsArrayRelation(repository);
  const relationTypeName = getRelationTypeName(repository);
  const primaryColumn = repository.metadata.primaryColumns[0].propertyName;

  const dataType = {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: [camelToKebab(repository.metadata.name)],
      },
      id: {
        type: 'string',
      },
      attributes: {
        type: 'object',
        properties: ObjectTyped.entries(fieldTypes)
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
                enum: [
                  camelToKebab(relationTypeName[name as EntityRelation<E>]),
                ],
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
              data: arrayField[name as EntityRelation<E>]
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

export function createApiModels<E extends Entity>(
  repository: Repository<E>
): Type<E> {
  const propsType = getFieldWithType(repository);
  const relationTypeName = getRelationTypeName(repository);
  const relationArray = getIsArrayRelation(repository);

  const result = repository.create({
    ...propsType,
    ...ObjectTyped.entries(relationTypeName).reduce((acum, [name, value]) => {
      acum[name.toString()] = relationArray[name] ? [value] : value;
      return acum;
    }, {} as any),
  } as DeepPartial<E>);

  const newEntity = nameIt(repository.metadata.name, class {}) as Type<E>;
  for (const [name, value] of Object.entries(result)) {
    let currentType: any;
    let isArray = false;
    if (name in propsType) {
      switch (value) {
        case TypeField.array:
          currentType = String;
          isArray = true;
          break;
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
    } else {
      currentType = relationTypeName[name as EntityRelation<E>];
      isArray = Array.isArray(value);
    }
    ApiProperty({
      required: false,
      isArray: isArray,
      type: () => currentType,
    })(newEntity.prototype, name);
  }

  return newEntity;
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
