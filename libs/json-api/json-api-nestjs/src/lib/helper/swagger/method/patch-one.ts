import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ParseIntPipe, Type } from '@nestjs/common';
import { extendApi, generateSchema } from '@anatine/zod-openapi';
import { Repository } from 'typeorm';

import { jsonSchemaResponse, errorSchema } from '../utils';

import { zodInputPatchSchema, zodInputPostSchema } from '../../zod';
import { Binding, ConfigParam, Entity } from '../../../types';
import { createZodDto } from '@anatine/zod-nestjs';

export function patchOne<E extends Entity>(
  controller: Type<any>,
  repository: Repository<E>,
  binding: Binding<'patchOne'>,
  config: ConfigParam
) {
  const entityName = repository.metadata.name;

  const descriptor = Reflect.getOwnPropertyDescriptor(controller, binding.name);

  if (!descriptor)
    throw new Error(`Descriptor for entity controller ${entityName} is empty`);

  const classBodySchemaDto = createZodDto(
    extendApi(zodInputPostSchema(repository))
  );
  Object.defineProperty(classBodySchemaDto, 'name', {
    value: `${entityName}PatchOne`,
  });
  ApiExtraModels(classBodySchemaDto)(controller.constructor);

  ApiOperation({
    summary: `Update item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${binding.name}`,
  })(controller, binding.name, descriptor);

  ApiParam({
    name: 'id',
    required: true,
    type: config.pipeForId === ParseIntPipe ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, binding.name, descriptor);

  ApiBody({
    description: `Json api schema for update "${entityName}" item`,
    schema: generateSchema(zodInputPatchSchema(repository)) as
      | SchemaObject
      | ReferenceObject,
    required: true,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 200,
    description: `Item of resource "${entityName}" has been updated`,
    schema: jsonSchemaResponse(repository),
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong body parameters',
    schema: errorSchema,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 422,
    description: 'Unprocessable data',
    schema: errorSchema,
  })(controller, binding.name, descriptor);
}
