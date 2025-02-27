import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { generateSchema } from '@anatine/zod-openapi';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Type } from '@nestjs/common';

import { EntityClass } from '../../../../types';
import { errorSchema, jsonSchemaResponse } from '../utils';
import { zodPost } from '../../zod';
import { EntityParamMapService } from '../../service';

export function postOne<E extends object, IdKey extends string = 'id'>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>,
  methodName: string
) {
  const entityName = entity.name;

  ApiOperation({
    summary: `Create item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiBody({
    description: `Json api schema for new "${entityName}" item`,
    schema: generateSchema(zodPost(mapEntity)) as
      | SchemaObject
      | ReferenceObject,
    required: true,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 201,
    description: `Item of resource "${entityName}" has been created`,
    schema: jsonSchemaResponse(entity, mapEntity),
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong body parameters',
    schema: errorSchema,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 422,
    description: 'Unprocessable data',
    schema: errorSchema,
  })(controller, methodName, descriptor);
}
