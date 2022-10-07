import { ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Binding, NestController, Entity, ConfigParam } from '../../../types';
import { errorSchema } from './index';

export function deleteOne(
  controller: NestController,
  entity: Entity,
  binding: Binding<'deleteOne'>,
  config: ConfigParam
) {
  const entityName =
    entity instanceof Function ? entity.name : entity.options.name;
  const descriptor = Reflect.getOwnPropertyDescriptor(
    controller.prototype,
    binding.name
  );

  if (!descriptor) {
    return;
  }

  ApiParam({
    name: 'id',
    required: true,
    type: 'integer',
    description: `ID of resource "${entityName}"`,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 404,
    description: `Item of resource "${entityName}" not found`,
    schema: errorSchema,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 204,
    description: `Item of resource "${entityName}" has been deleted`,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong query parameters',
    schema: errorSchema,
  })(controller.prototype, binding.name, descriptor);

  ApiOperation({
    summary: `Delete item of resource "${entityName}"`,
    operationId: `${controller.name}_${binding.name}`,
  })(controller.prototype, binding.name, descriptor);
}
