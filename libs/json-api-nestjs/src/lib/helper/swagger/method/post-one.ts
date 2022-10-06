import {ApiOperation, ApiResponse, ApiBody} from '@nestjs/swagger';
import {plainToClass} from 'class-transformer';
import {getMetadataStorage, IS_EMPTY, IS_NOT_EMPTY} from 'class-validator';

import {Binding, ConfigParam, Entity, NestController} from '../../../types';
import {getColumOptions, getOptionsFiled, getRelationsOptions, jsonSchemaBody, jsonSchemaResponse} from '../utils';
import {getEntityName, camelToKebab} from '../../utils'

import {errorSchema} from './index';


export function postOne(
  controller: NestController,
  entity: Entity,
  binding: Binding<'postOne'>,
  config: ConfigParam
) {
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

  ApiBody({
    description: `Json api schema for new "${entityName}" item`,
    schema: {
      type: 'object',
      properties: jsonSchemaBody(entity, currentField),
      required: [
        'data'
      ]
    },
    required: true
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 201,
    schema: {
      ...jsonSchemaResponse(entity, currentField)
    },
    description: `Item of resource "${entityName}" has been created`,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 422,
    description: 'Unprocessable data',
    schema: errorSchema
  })(controller.prototype, binding.name, descriptor);

  ApiOperation({
    summary: `Create item of resource "${entityName}"`,
    operationId: `${controller.name}_${binding.name}`,
  })(controller.prototype, binding.name, descriptor);
}
