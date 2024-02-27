import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ParseIntPipe, Type } from '@nestjs/common';
import { extendApi, generateSchema } from '@anatine/zod-openapi';
import { createZodDto } from '@anatine/zod-nestjs';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Repository } from 'typeorm';

import { Binding, ConfigParam, Entity } from '../../../types';
import { errorSchema } from '../utils';
import { getField } from '../../orm';
import { zodInputPatchRelationshipSchema, zodInputPostSchema } from '../../zod';

export function deleteRelationship<E extends Entity>(
  controller: Type<any>,
  repository: Repository<E>,
  binding: Binding<'deleteRelationship'>,
  config: ConfigParam
) {
  const entityName = repository.metadata.name;

  const descriptor = Reflect.getOwnPropertyDescriptor(
    controller.constructor.prototype,
    binding.name
  );

  if (!descriptor)
    throw new Error(`Descriptor for entity controller ${entityName} is empty`);

  const { relations } = getField(repository);

  const classBodySchemaDto = createZodDto(
    extendApi(zodInputPostSchema(repository))
  );
  Object.defineProperty(classBodySchemaDto, 'name', {
    value: `${entityName}DeleteRelationship`,
  });
  ApiExtraModels(classBodySchemaDto)(controller.constructor);

  ApiOperation({
    summary: `Delete list of relation for resource "${entityName}"`,
    operationId: `${controller.name}_${binding.name}`,
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

  ApiBody({
    description: `Json api schema for delete "${entityName}" item`,
    schema: generateSchema(zodInputPatchRelationshipSchema) as
      | SchemaObject
      | ReferenceObject,
    required: true,
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

  ApiResponse({
    status: 204,
    description: `Item/s of relation for "${entityName}" has been deleted`,
  })(controller, binding.name, descriptor);
}
