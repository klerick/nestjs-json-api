import {Binding, ConfigParam, Entity, NestController} from '../../../types';
import {getRelationsOptions} from '../utils';
import {ApiBody, ApiOperation, ApiParam, ApiResponse} from '@nestjs/swagger';
import {errorSchema} from './index';

export function patchRelationship(
  controller: NestController,
  entity: Entity,
  binding: Binding<'postRelationship'>,
  config: ConfigParam
){
  const entityName = entity instanceof Function ? entity.name : entity.options.name;
  const descriptor = Reflect.getOwnPropertyDescriptor(controller.prototype, binding.name);

  const relationsOptions = getRelationsOptions(entity);

  if (!descriptor) {
    return;
  }
  const dataType = {
    type: 'object',
    properties: {
      type: {
        type: 'string'
      },
      id: {
        type: 'string'
      }
    }
  };
  const schemaType = {
    type: 'object',
    properties: {
      data: {
        oneOf: [
          dataType,
          {type: 'null'},
          {
            type: 'array',
            items: dataType,
          }
        ]
      }
    }
  }
  ApiBody({
    description: `Item/s of relation for "${entityName}". Request 'data' field depends on relationship type. For "one-to-many" and "many-to-many" relations it should contain an array.`,
    schema: schemaType,
    required: true,
  })(controller.prototype, binding.name, descriptor);

  ApiParam({
    name: 'id',
    required: true,
    type: 'integer',
    description: `ID of resource "${entityName}"`,
  })(controller.prototype, binding.name, descriptor);

  ApiParam({
    name: 'relName',
    required: true,
    type: 'string',
    enum: Object.keys(relationsOptions),
    description: `Relation name of resource "${entityName}"`,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 200,
    schema: schemaType,
    description: `Item/s of relation for "${entityName}" has been updated`,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong url parameters',
    schema: errorSchema
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 422,
    description: 'Incorrect type for relation',
    schema: errorSchema
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 404,
    description: 'Resource not found ',
    schema: errorSchema
  })(controller.prototype, binding.name, descriptor);

  ApiOperation({
    summary: `Update list of relation for resource "${entityName}"`,
    operationId: `${controller.name}_${binding.name}`,
  })(controller.prototype, binding.name, descriptor);
}
