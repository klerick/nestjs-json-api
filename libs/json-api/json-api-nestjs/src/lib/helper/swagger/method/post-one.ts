import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';

import { Binding, ConfigParam, Entity } from '../../../types';
import { jsonSchemaResponse } from '../utils';

import { errorSchema } from '../utils';
import { Type } from '@nestjs/common';
import { Repository } from 'typeorm';

import { generateSchema, extendApi } from '@anatine/zod-openapi';

import { zodInputPostSchema } from '../../zod';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { createZodDto } from '@anatine/zod-nestjs';

export function postOne<E extends Entity>(
  controller: Type<any>,
  repository: Repository<E>,
  binding: Binding<'postOne'>,
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
    value: `${entityName}PostOne`,
  });
  ApiExtraModels(classBodySchemaDto)(controller.constructor);

  ApiOperation({
    summary: `Create item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${binding.name}`,
  })(controller, binding.name, descriptor);

  ApiBody({
    description: `Json api schema for new "${entityName}" item`,
    schema: generateSchema(zodInputPostSchema(repository)) as
      | SchemaObject
      | ReferenceObject,
    required: true,
  })(controller, binding.name, descriptor);

  ApiResponse({
    status: 201,
    description: `Item of resource "${entityName}" has been created`,
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
