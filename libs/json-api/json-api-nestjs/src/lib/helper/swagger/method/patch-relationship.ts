import { ParseIntPipe, Type } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { extendApi, generateSchema } from '@anatine/zod-openapi';
import { Repository } from 'typeorm';
import { Binding, ConfigParam, Entity } from '../../../types';
import { schemaTypeForRelation, errorSchema } from '../utils';
import { zodInputPatchRelationshipSchema, zodInputPostSchema } from '../../zod';
import { getField } from '../../orm';
import { createZodDto } from '@anatine/zod-nestjs';

export function patchRelationship<E extends Entity>(
  controller: Type<any>,
  repository: Repository<E>,
  binding: Binding<'patchRelationship'>,
  config: ConfigParam
) {
  const entityName = repository.metadata.name;

  const descriptor = Reflect.getOwnPropertyDescriptor(controller, binding.name);

  if (!descriptor)
    throw new Error(`Descriptor for entity controller ${entityName} is empty`);

  const { relations } = getField(repository);

  const classBodySchemaDto = createZodDto(
    extendApi(zodInputPostSchema(repository))
  );
  Object.defineProperty(classBodySchemaDto, 'name', {
    value: `${entityName}PatchRelationship`,
  });
  ApiExtraModels(classBodySchemaDto)(controller.constructor);

  ApiOperation({
    summary: `Update list of relation for resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${binding.name}`,
  })(controller.prototype, binding.name, descriptor);

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
  })(controller.prototype, binding.name, descriptor);

  ApiBody({
    description: `Json api schema for update "${entityName}" item`,
    schema: generateSchema(zodInputPatchRelationshipSchema) as
      | SchemaObject
      | ReferenceObject,
    required: true,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 200,
    schema: schemaTypeForRelation,
    description: `Item/s of relation for "${entityName}" has been updated`,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong url parameters',
    schema: errorSchema,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 422,
    description: 'Incorrect type for relation',
    schema: errorSchema,
  })(controller.prototype, binding.name, descriptor);

  ApiResponse({
    status: 404,
    description: 'Resource not found ',
    schema: errorSchema,
  })(controller.prototype, binding.name, descriptor);
}
