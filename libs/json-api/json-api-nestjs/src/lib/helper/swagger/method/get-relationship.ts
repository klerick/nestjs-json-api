import { ParseIntPipe, Type } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Repository } from 'typeorm';

import { Binding, ConfigParam, Entity } from '../../../types';
import { errorSchema, schemaTypeForRelation } from '../utils';
import { getField } from '../../orm';

export function getRelationship<E extends Entity>(
  controller: Type<any>,
  repository: Repository<E>,
  binding: Binding<'getRelationship'>,
  config: ConfigParam
) {
  const entityName = repository.metadata.name;

  const descriptor = Reflect.getOwnPropertyDescriptor(controller, binding.name);

  if (!descriptor)
    throw new Error(`Descriptor for entity controller ${entityName} is empty`);

  const { relations } = getField(repository);

  ApiOperation({
    summary: `Get list of relation for resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${binding.name}`,
  })(controller, binding.name, descriptor);

  ApiParam({
    name: 'id',
    required: true,
    type: config.pipeForId === ParseIntPipe ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, binding.name, descriptor);

  ApiParam({
    name: 'relName',
    required: true,
    type: 'string',
    enum: relations,
    description: `Relation name of resource "${entityName}"`,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 200,
    schema: schemaTypeForRelation,
    description: `Item/s of relation for "${entityName}" has been created`,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong url parameters',
    schema: errorSchema,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 422,
    description: 'Incorrect type for relation',
    schema: errorSchema,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 404,
    description: 'Resource not found ',
    schema: errorSchema,
  })(controller, binding.name, descriptor);
}
