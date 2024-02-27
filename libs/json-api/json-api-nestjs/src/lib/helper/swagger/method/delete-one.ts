import { ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParseIntPipe, Type } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Binding, Entity, ConfigParam } from '../../../types';
import { errorSchema } from '../utils';

export function deleteOne<E extends Entity>(
  controller: Type<any>,
  repository: Repository<E>,
  binding: Binding<'deleteOne'>,
  config: ConfigParam
) {
  const entityName = repository.metadata.name;

  const descriptor = Reflect.getOwnPropertyDescriptor(controller, binding.name);
  if (!descriptor)
    throw new Error(`Descriptor for entity controller ${entityName} is empty`);

  ApiParam({
    name: 'id',
    required: true,
    type: config.pipeForId === ParseIntPipe ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, binding.name, descriptor);

  ApiOperation({
    summary: `Delete item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${binding.name}`,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 404,
    description: `Item of resource "${entityName}" not found`,
    schema: errorSchema,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 204,
    description: `Item of resource "${entityName}" has been deleted`,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong query parameters',
    schema: errorSchema,
  })(controller, binding.name, descriptor);
}
