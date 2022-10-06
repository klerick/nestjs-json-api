import {Binding, ConfigParam, Entity, NestController} from '../../../types';
import {ApiOperation, ApiParam, ApiResponse} from '@nestjs/swagger';
import {getRelationsOptions} from '../utils';
import {errorSchema} from './index';

export function getRelationship(
  controller: NestController,
  entity: Entity,
  binding: Binding<'getRelationship'>,
  config: ConfigParam
){
  const entityName = entity instanceof Function ? entity.name : entity.options.name;
  const descriptor = Reflect.getOwnPropertyDescriptor(controller.prototype, binding.name);

  const relationsOptions = getRelationsOptions(entity);

  if (!descriptor) {
    return;
  }


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
  ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        data: {
          oneOf: [
            dataType,
            {
              type: 'array',
              items: dataType,
              minItems: 1
            }
          ]
        }
      }
    },
    description: `Item/s of relation of "${entityName}". Relationships received successfully. Response 'data' field depends on relationship type.
For many-to-many relations it should contain an array.`,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong url parameters',
    schema: errorSchema
  })(controller.prototype, binding.name, descriptor);

  ApiOperation({
    summary: `Get list of relation for resource "${entityName}"`,
    operationId: `${controller.name}_${binding.name}`,
  })(controller.prototype, binding.name, descriptor);
}
