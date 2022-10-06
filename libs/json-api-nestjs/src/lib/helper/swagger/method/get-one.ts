import {Binding, NestController, Entity, ConfigParam} from '../../../types';
import {ApiOperation, ApiParam, ApiQuery, ApiResponse} from '@nestjs/swagger';
import {getColumOptions, getRelationsOptions, jsonSchemaResponse} from '../utils';
import {plainToClass} from 'class-transformer';
import {errorSchema} from './index';

export function getOne(
  controller: NestController,
  entity: Entity,
  binding: Binding<'getOne'>,
  config: ConfigParam
){
  const entityName = entity instanceof Function ? entity.name : entity.options.name;
  const descriptor = Reflect.getOwnPropertyDescriptor(controller.prototype, binding.name);

  if (!descriptor) {
    return;
  }

  const relationsOptions = getRelationsOptions(entity);
  const relationsFields = Object.keys(relationsOptions);

  const columOptions = getColumOptions(entity);
  const fakeObject = Object.keys(columOptions).reduce<Record<string, string>>((acum, item) => {
    acum[item] = '';
    return acum;
  }, {});

  const currentField = Object.keys(plainToClass(entity as any, fakeObject)).map(i => i);


  ApiParam({
    name: 'id',
    required: true,
    type: 'integer',
    description: `ID of resource "${entityName}"`,
  })(controller.prototype, binding.name, descriptor);

  ApiQuery({
    name: 'include',
    required: false,
    enum: relationsFields,
    style: 'simple',
    isArray: true,
    description: `"${entityName}" resource item has been extended with existing relations`
  })(controller.prototype, binding.name, descriptor);

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

  ApiResponse({
    status: 404,
    description: `Item of resource "${entityName}" not found`,
    schema: errorSchema
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong query parameters',
    schema: errorSchema
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 200,
    description: 'Resource list received successfully',
    schema: {
      ...jsonSchemaResponse(entity, currentField)
    },
  })(controller.prototype, binding.name, descriptor);

  ApiOperation({
    summary: `Get item of resource "${entityName}"`,
    operationId: `${controller.name}_${binding.name}`,
  })(controller.prototype, binding.name, descriptor);
}
