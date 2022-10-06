import {ApiOperation, ApiQuery, ApiResponse, getSchemaPath, ApiProperty, ApiExtraModels} from '@nestjs/swagger';
import {getMetadataArgsStorage} from 'typeorm';
import {plainToClass} from 'class-transformer';
import {ColumnType} from 'typeorm/driver/types/ColumnTypes';
import {RelationTypeInFunction} from 'typeorm/metadata/types/RelationTypeInFunction';

import {DEFAULT_PAGE_SIZE, DEFAULT_QUERY_PAGE} from '../../../constants';
import {Binding, NestController, Entity, ConfigParam} from '../../../types';
import {camelToKebab, getEntityName, nameIt} from '../../utils';
import {getColumOptions, getRelationsOptions} from '../utils';
import {errorSchema} from './index';

export function getAll(
  controller: NestController,
  entity: Entity,
  binding: Binding<'getAll'>,
  config: ConfigParam
): void {
  const entityName = entity instanceof Function ? entity.name : entity.options.name;
  const descriptor = Reflect.getOwnPropertyDescriptor(controller.prototype, binding.name);

  if (!descriptor) {
    return;
  }

  const columOptions = getColumOptions(entity);
  const fakeObject = Object.keys(columOptions).reduce<Record<string, string>>((acum, item) => {
    acum[item] = '';
    return acum;
  }, {});

  const currentField = Object.keys(plainToClass(entity as any, fakeObject)).map(i => i);

  const relationsOptions = getRelationsOptions(entity);

  const jsonSchemaResponse = {
    'type': 'object',
    'properties': {
      'meta': {
        'type': 'object',
        'properties': {
          'pageSize': {
            'type': 'integer'
          },
          'totalItems': {
            'type': 'integer'
          },
          'pageNumber': {
            'type': 'integer'
          },
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
            },
            'required': [
              'callQuery',
              'prepareParams',
              'transform'
            ]
          }
        },
        'required': [
          'pageSize',
          'totalItems',
          'pageNumber'
        ]
      },
      'data': {
        'type': 'array',
        'items': {
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
            'relationships',
            'links'
          ]
        }
      },
      'included': {
        'type': 'array',
        'items': {}
      }
    },
    'required': [
      'meta',
      'data',
      'included'
    ]
  }


  const relationsFields = Object.keys(relationsOptions);


  ApiQuery({
    name: 'fields',
    required: false,
    style: 'deepObject',
    schema: {
      type: 'object',
    },
    example: {target: currentField.join(','), [relationsFields[0]]: 'id'},
    description: `Object of field for select field from "${entityName}" resource`
  })(controller.prototype, binding.name, descriptor);

  ApiQuery({
    name: 'filter',
    required: false,
    style: 'deepObject',
    schema: {
      type: 'object',
      additionalProperties: false,
    },
    example: {[currentField[0]]: {eq: 'test'}, [`${relationsFields[0]}.id`]: {ne: '1'}},
    description: `Object of filter for select items from "${entityName}" resource`
  })(controller.prototype, binding.name, descriptor);

  ApiQuery({
    name: 'include',
    required: false,
    enum: relationsFields,
    style: 'simple',
    isArray: true,
    description: `"${entityName}" resource has been extended with existing relations`
  })(controller.prototype, binding.name, descriptor);

  ApiQuery({
    name: 'sort',
    type: 'string',
    required: false,
    description: `"${entityName}" resource has been filtered with existing attribute: "${currentField.join('", "')}". Divide by comma.`
  })(controller.prototype, binding.name, descriptor);

  ApiQuery({
    name: 'page',
    style: 'deepObject',
    required: false,
    schema: {
      type: 'object',
      properties: {
        number: {
          type: 'integer',
          minimum: 1,
          example: DEFAULT_QUERY_PAGE
        },
        size: {
          type: 'integer',
          minimum: 1,
          example: DEFAULT_PAGE_SIZE,
          maximum: 500
        }
      },
      additionalProperties: false
    },
    description: `"${entityName}" resource has been limit and offset with this params.`
  })(controller.prototype, binding.name, descriptor);


  ApiOperation({
    summary: `Get list items of resource "${entityName}"`,
    operationId: `${controller.name}_${binding.name}`
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 200,
    description: 'Resource list received successfully',
    schema: {
      ...jsonSchemaResponse as any
    },
  })(controller.prototype, binding.name, descriptor);


  ApiResponse({
    status: 400,
    description: 'Wrong query parameters',
    schema: errorSchema
  })(controller.prototype, binding.name, descriptor);
}

