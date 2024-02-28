import { ParseIntPipe, Type } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Repository } from 'typeorm';

import { Binding, Entity, ConfigParam } from '../../../types';
import { jsonSchemaResponse, errorSchema } from '../utils';

import {
  getField,
  getPropsTreeForRepository,
  getPrimaryColumnsForRelation,
} from '../../orm';
import { ObjectTyped } from '../../utils';

export function getOne<E extends Entity>(
  controller: Type<any>,
  repository: Repository<E>,
  binding: Binding<'getOne'>,
  config: ConfigParam
) {
  const entityName = repository.metadata.name;
  const descriptor = Reflect.getOwnPropertyDescriptor(controller, binding.name);
  if (!descriptor)
    throw new Error(
      `Descriptor for entity controller ${entityName}:${binding.name} is empty`
    );

  const { relations, field } = getField(repository);
  const propsTree = getPropsTreeForRepository(repository);
  const relationPrimaryColum = getPrimaryColumnsForRelation(repository);
  const primaryColumn = repository.metadata.primaryColumns[0].propertyName;

  ApiOperation({
    summary: `Get one item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${binding.name}`,
  })(controller, binding.name, descriptor);

  ApiParam({
    name: 'id',
    required: true,
    type: config.pipeForId === ParseIntPipe ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
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
    description: 'Resource one item received successfully',
    schema: jsonSchemaResponse(repository),
  })(controller, binding.name, descriptor);
}
