import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Type } from '@nestjs/common';
import { EntityClass } from '@klerick/json-api-nestjs-shared';

import {
  errorSchema,
  jsonSchemaResponse,
  zodToJSONSchemaParams,
} from '../utils';
import { zodPost } from '../../zod';
import { EntityParamMapService } from '../../service';
import { getJsonApiImmutableFields, getJsonApiReadOnlyFields } from '../../decorators';
import { ExtractJsonApiImmutableKeys, ExtractJsonApiReadOnlyKeys } from '../../../../types';

export function postOne<E extends object, IdKey extends string = 'id'>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>,
  methodName: string
) {
  const entityName = entity.name;

  const readOnlyProps = getJsonApiReadOnlyFields(
    entity
  ) as ExtractJsonApiReadOnlyKeys<E>[];
  const immutableProps = getJsonApiImmutableFields(
    entity
  ) as ExtractJsonApiImmutableKeys<E>[];

  ApiOperation({
    summary: `Create item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiBody({
    description: `Json api schema for new "${entityName}" item`,
    schema: z.toJSONSchema(
      zodPost(mapEntity, readOnlyProps, immutableProps),
      zodToJSONSchemaParams
    ) as SchemaObject | ReferenceObject,
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
