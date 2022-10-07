import { Binding, ConfigParam, Entity, NestController } from '../../../types';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { errorSchema } from './index';
import { getColumOptions, jsonSchemaBody, jsonSchemaResponse } from '../utils';
import { plainToClass } from 'class-transformer';

export function patchOne(
  controller: NestController,
  entity: Entity,
  binding: Binding<'patchOne'>,
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

  const columOptions = getColumOptions(entity);
  const fakeObject = Object.keys(columOptions).reduce<Record<string, string>>(
    (acum, item) => {
      acum[item] = '';
      return acum;
    },
    {}
  );

  const currentField = Object.keys(plainToClass(entity as any, fakeObject)).map(
    (i) => i
  );

  ApiParam({
    name: 'id',
    required: true,
    type: 'integer',
    description: `ID of resource "${entityName}"`,
  })(controller.prototype, binding.name, descriptor);

  const jsonSchemaProperty = jsonSchemaBody(entity, currentField);
  jsonSchemaProperty.data.properties = {
    ...{
      id: {
        type: 'string',
      },
    },
    ...jsonSchemaProperty.data.properties,
  };
  jsonSchemaProperty.data.required.push('id');

  ApiBody({
    description: `Json api schema for update "${entityName}" item`,
    schema: {
      type: 'object',
      properties: jsonSchemaProperty,
      required: ['data'],
    },
    required: true,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 200,
    schema: {
      ...jsonSchemaResponse(entity, currentField),
    },
    description: `Item of resource "${entityName}" has been created`,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 422,
    description: 'Unprocessable data',
    schema: errorSchema,
  })(controller.prototype, binding.name, descriptor);

  ApiOperation({
    summary: `Update item of resource "${entityName}"`,
    operationId: `${controller.name}_${binding.name}`,
  })(controller.prototype, binding.name, descriptor);
}
