import {ApiProperty} from '@nestjs/swagger';
import {plainToClass} from 'class-transformer';
import {getMetadataArgsStorage} from 'typeorm';
import {getMetadataStorage, IS_EMPTY, IS_NOT_EMPTY} from 'class-validator';
import {RelationTypeInFunction} from 'typeorm/metadata/types/RelationTypeInFunction';

import {Entity} from '../../types';
import {ColumnType} from 'typeorm/driver/types/ColumnTypes';
import {camelToKebab, getEntityName, nameIt} from '../utils';


export function getRelationsOptions(entity: Entity) {
  return getMetadataArgsStorage().relations
    .filter(i => i.target === entity)
    .reduce<Record<string, RelationTypeInFunction>>((acum, item) => {
      acum[item.propertyName] = item.type;
      return acum;
    }, {});
}

export function getOptionsFiled(entity: Entity){
  return getMetadataStorage()
    .getTargetValidationMetadatas(entity as any, '', false, true)
    .reduce((acum, i) => {
      if (i.constraintCls) {

        const option = getMetadataStorage().getTargetValidatorConstraints(i.constraintCls)
          .filter(i => i.name === IS_NOT_EMPTY || i.name === IS_EMPTY)
          .map(i => i.name)
        if (option.length > 0) {
          if (option.length === 1) {
            acum[i.propertyName] = option[0];
          } else {
            acum[i.propertyName] = option.includes(IS_NOT_EMPTY) ? IS_NOT_EMPTY : IS_EMPTY
          }

        }

      }
      return acum;
    }, {});
}

export function jsonSchemaBody(entity: Entity, currentField: string[]){
  const optionsFiled = getOptionsFiled(entity);
  const relationsOptions = getRelationsOptions(entity);
  return {
    data: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            camelToKebab(getEntityName(entity))
          ]
        },
        attributes: {
          type: 'object',
            properties: currentField
            .filter(item => optionsFiled[item] !== IS_EMPTY)
            .reduce((acum, item) => {
              const typeMetadata = Reflect.getMetadata('design:type', entity['prototype'], item);
              let value = {};
              switch (typeMetadata) {
                case Array:
                  value = {
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  };
                  break;
                case Date:
                  value = {
                    format: 'date-time',
                    type: 'string'
                  };
                  break;
                case Number:
                  value = {
                    type: 'integer'
                  };
                  break;
                case Boolean:
                  value = {
                    type: 'boolean'
                  };
                  break;
                default:
                  value = {
                    type: 'string'
                  }
              }
              acum[item] = value;
              return acum;
            }, {}),
            required: currentField.filter(i => optionsFiled[i] === IS_NOT_EMPTY)
        },
        relationships: {
          type: 'object',
            properties: Object.keys(relationsOptions).reduce((acum, item) => {
            const dataItem = {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    // @ts-ignore
                    camelToKebab(getEntityName(relationsOptions[item]()))
                  ]
                },
                id: {
                  'type': 'string'
                }
              },
              required: [
                'type',
                'id'
              ]
            }

            const dataArray = {
              type: 'array',
              items: dataItem
            };


            acum[item] = {
              type: 'object',
              properties: {
                data: Reflect.getMetadata('design:type', entity['prototype'], item) === Array ? dataArray : dataItem,
              },
              required: [
                'data'
              ]
            }
            return acum;
          }, {}),
            required: Object.keys(relationsOptions).filter(i => optionsFiled[i] === IS_NOT_EMPTY)
        }
      },
      required: [
        'type',
        'attributes'
      ]
    }
  }
}

export function jsonSchemaResponse(entity: Entity, currentField: string[]){
  const relationsOptions = getRelationsOptions(entity);
  return {
    'type': 'object',
    'properties': {
      'meta': {
        'type': 'object',
        'properties': {
          'debug': {
            'type': 'object',
            'properties': {
              'callQuery': {
                'type': 'integer'
              },
              'prepareParams': {
                'type': 'integer'
              },
              'transform': {
                'type': 'integer'
              }
            }
          }
        }
      },
      'data': {
        'type': 'object',
        'properties': {
          'type': {
            'type': 'string',
            'enum': [
              camelToKebab(getEntityName(entity))
            ]
          },
          'id': {
            'type': 'string'
          },
          'attributes': {
            'type': 'object',
            'properties': currentField.reduce((acum, item) => {
              const typeMetadata = Reflect.getMetadata('design:type', entity['prototype'], item);
              let value = {};
              switch (typeMetadata) {
                case Array:
                  value = {
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  };
                  break;
                case Date:
                  value = {
                    format: 'date-time',
                    type: 'string'
                  };
                  break;
                case Number:
                  value = {
                    type: 'integer'
                  };
                  break;
                case Boolean:
                  value = {
                    type: 'boolean'
                  };
                  break;
                default:
                  value = {
                    type: 'string'
                  }
              }
              acum[item] = value;
              return acum;
            }, {}),
          },
          'relationships': {
            'type': 'object',
            'properties': Object.keys(relationsOptions).reduce((acum, item) => {
              const dataItem = {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: [
                      // @ts-ignore
                      camelToKebab(getEntityName(relationsOptions[item]()))
                    ]
                  },
                  id: {
                    'type': 'string'
                  }
                },
                required: [
                  'type',
                  'id'
                ]
              }

              const dataArray = {
                type: 'array',
                items: dataItem
              };


              acum[item] = {
                type: 'object',
                properties: {
                  data: Reflect.getMetadata('design:type', entity['prototype'], item) === Array ? dataArray : dataItem,
                  links: {
                    type: 'object',
                    properties: {
                      self: {
                        type: 'string'
                      },
                      related: {
                        type: 'string'
                      }
                    },
                    required: [
                      'self',
                      'related'
                    ]
                  }
                },
                required: [
                  'links'
                ]
              }
              return acum;
            }, {}),
            'required': Object.keys(relationsOptions)
          },
          'links': {
            'type': 'object',
            'properties': {
              'self': {
                'type': 'string'
              }
            },
            'required': [
              'self'
            ]
          }
        },
        'required': [
          'type',
          'id',
          'attributes',
          'links',
          'relationships'
        ]
      }
    },
    'required': [
      'meta',
      'data'
    ]
  }
}

export function getColumOptions(entity: Entity) {
  return getMetadataArgsStorage().columns
    .filter(i => i.target === entity && !i.options.primary)
    .reduce<Record<string, ColumnType>>((acum, item) => {
      if (item.options.type) {
        acum[item.propertyName] = item.options.type;
      }

      return acum;
    }, {});
}

export function getFakeObject() {

}

export function createApiModels(entity: Entity): Function {
  const columOptions = getColumOptions(entity);
  const relationsOptions = getRelationsOptions(entity);
  const fakeObject = Object.keys(columOptions).reduce<Record<string, string>>((acum, item) => {
    acum[item] = '';
    return acum;
  }, {});
  const currentField = Object.keys(plainToClass(entity as any, fakeObject)).map(i => i);
  const relationsFields = Object.keys(relationsOptions);
  const entityName = entity instanceof Function ? entity.name : entity.options.name;
  const newEntity = nameIt(entityName, class {
  });
  return [...currentField, ...relationsFields].reduce((acum, item) => {

    const type = columOptions[item]
      ? Reflect.getMetadata('design:type', entity['prototype'], item)
      // @ts-ignore
      : nameIt(relationsOptions[item]().name, class {
      });

    let isArray = false;
    if (!(item in fakeObject) && Reflect.getMetadata('design:type', entity['prototype'], item) === Array) {
      isArray = true;
    }
    const currentType = type.name === entityName ? acum : type;

    Reflect.defineMetadata('design:type', currentType, acum.prototype, item);

    ApiProperty({
      required: false,
      isArray: isArray,
      type: () => currentType
    })(acum.prototype, item)
    return acum;
  }, newEntity)
}
