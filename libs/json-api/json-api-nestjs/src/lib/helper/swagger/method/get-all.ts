import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Type } from '@nestjs/common';
import { Repository } from 'typeorm';

import { DEFAULT_PAGE_SIZE, DEFAULT_QUERY_PAGE } from '../../../constants';
import { Binding, Entity, ConfigParam } from '../../../types';
import { ObjectTyped } from '../../utils';
import { errorSchema, jsonSchemaResponse } from '../utils';

import {
  fromRelationTreeToArrayName,
  getField,
  getPrimaryColumnsForRelation,
  getPropsTreeForRepository,
} from '../../orm';

export function getAll<E extends Entity>(
  controller: Type<any>,
  repository: Repository<E>,
  binding: Binding<'getAll'>,
  config: ConfigParam
): void {
  const entityName = repository.metadata.name;

  const descriptor = Reflect.getOwnPropertyDescriptor(controller, binding.name);
  if (!descriptor)
    throw new Error(`Descriptor for entity controller ${entityName} is empty`);

  const { relations, field } = getField(repository);
  const propsTree = getPropsTreeForRepository(repository);
  const relationTree = fromRelationTreeToArrayName(propsTree);
  const relationPrimaryColum = getPrimaryColumnsForRelation(repository);
  const primaryColumn = repository.metadata.primaryColumns[0].propertyName;

  ApiOperation({
    summary: `Get list items of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${binding.name}`,
  })(controller, binding.name, descriptor);

  ApiQuery({
    name: 'fields',
    required: false,
    style: 'deepObject',
    schema: {
      type: 'object',
    },
    examples: {
      allField: {
        summary: 'Select all field',
        description: 'Select field for target and relation',
        value: {
          target: field.join(','),
          ...ObjectTyped.entries(propsTree).reduce((acum, [name, props]) => {
            acum[name.toString()] = props.join(',');
            return acum;
          }, {} as Record<string, string>),
        },
      },
      selectOnlyIdsTarget: {
        summary: 'Select ids for target',
        description: 'Select ids for target',
        value: {
          target: field.filter((i) => i === primaryColumn).join(','),
        },
      },
      selectOnlyIds: {
        summary: 'Select ids',
        description: 'Select ids',
        value: {
          target: field.filter((i) => i === primaryColumn).join(','),
          ...ObjectTyped.entries(relationPrimaryColum).reduce(
            (acum, [name, props]) => {
              acum[name.toString()] = props;
              return acum;
            },
            {} as Record<string, string>
          ),
        },
      },
    },
    description: `Object of field for select field from "${entityName}" resource`,
  })(controller, binding.name, descriptor);

  ApiQuery({
    name: 'filter',
    required: false,
    style: 'deepObject',
    schema: {
      type: 'object',
    },
    examples: {
      simpleExample: {
        summary: 'Several conditional',
        description: 'Get if relation is not null',
        value: {
          [field[0]]: {
            in: '1,2,3',
          },
          [field[1]]: {
            lt: '1',
          },
          [relationTree[0]]: {
            eq: 'test',
          },
        },
      },
      relationNull: {
        summary: 'Get if relation is null',
        description: 'Get if relation is null',
        value: {
          [relations[0]]: {
            eq: null,
          },
        },
      },
      relationNotNull: {
        summary: 'Get if relation is not null',
        description: 'Get if relation is not null',
        value: {
          [relations[0]]: {
            ne: null,
          },
        },
      },
      getRelationByConditional: {
        summary: 'Get if relation field is',
        description: 'Get if relation field is',
        value: {
          [relationTree[0]]: {
            eq: 'test',
          },
        },
      },
    },
    description: `Object of filter for select items from "${entityName}" resource`,
  })(controller, binding.name, descriptor);
  ApiQuery({
    name: 'include',
    required: false,
    enum: relations,
    style: 'simple',
    isArray: true,
    description: `"${entityName}" resource item has been extended with existing relations`,
    examples: {
      withInclude: {
        summary: 'Add all relation',
        description: 'Add all realtion',
        value: relations,
      },
      without: {
        summary: 'Without relation',
        description: 'Without all realtion',
        value: [],
      },
    },
  })(controller, binding.name, descriptor);
  ApiQuery({
    name: 'sort',
    type: 'string',
    required: false,
    description: `Params for sorting of "${entityName}"`,
    examples: {
      sortAsc: {
        summary: 'Sort field by ASC',
        description: 'Sort field by ASC',
        value: field[1],
      },
      sortDesc: {
        summary: 'Sort field by DESC',
        description: 'Sort field by DESC',
        value: `-${field[1]}`,
      },
      sortAscRelation: {
        summary: 'Sort field relation by ASC',
        description: 'Sort field relation by ASC',
        value: relationTree[2],
      },
      sortDescRelation: {
        summary: 'Sort field relation by DESC',
        description: 'Sort field relation by DESC',
        value: `-${relationTree[2]}`,
      },
      sortSeveral: {
        summary: 'Sort several field relation',
        description: 'Sort several field relation',
        value: `${field[1]},-${relationTree[2]},${relationTree[1]},-${field[0]}`,
      },
    },
  })(controller, binding.name, descriptor);

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
          example: DEFAULT_QUERY_PAGE,
        },
        size: {
          type: 'integer',
          minimum: 1,
          example: DEFAULT_PAGE_SIZE,
          maximum: 500,
        },
      },
      additionalProperties: false,
    },
    description: `"${entityName}" resource has been limit and offset with this params.`,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 404,
    description: `Item of resource "${entityName}" not found`,
    schema: errorSchema,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong query parameters',
    schema: errorSchema,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 200,
    description: 'Resource list received successfully',
    schema: jsonSchemaResponse(repository, true),
  })(controller, binding.name, descriptor);
}
