import { Type } from '@nestjs/common';
import { z } from 'zod';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { EntityClass } from '@klerick/json-api-nestjs-shared';

import {
  ExtractJsonApiImmutableKeys,
  ExtractJsonApiReadOnlyKeys,
  TypeField,
} from '../../../../types';

import {
  jsonSchemaResponse,
  zodToJSONSchemaParams,
} from '../utils';
import { zodPatch } from '../../zod';
import { EntityParamMapService } from '../../service';
import {
  getJsonApiImmutableFields,
  getJsonApiReadOnlyFields,
} from '../../decorators';
import { JsonApiErrorResponseModel } from '../error-response-model';

export function patchOne<E extends object, IdKey extends string = 'id'>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>,
  methodName: string
) {
  const entityName = entity.name;

  const primaryColumnType = mapEntity.entityParaMap.primaryColumnType;
  const readOnlyProps = getJsonApiReadOnlyFields(
    entity
  ) as ExtractJsonApiReadOnlyKeys<E>[];
  const immutableProps = getJsonApiImmutableFields(
    entity
  ) as ExtractJsonApiImmutableKeys<E>[];

  ApiOperation({
    summary: `Update item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiParam({
    name: 'id',
    required: true,
    type: primaryColumnType === TypeField.number ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, methodName, descriptor);

  ApiBody({
    description: `Json api schema for update "${entityName}" item`,
    schema: z.toJSONSchema(
      zodPatch(mapEntity, readOnlyProps, immutableProps),
      zodToJSONSchemaParams
    ) as SchemaObject | ReferenceObject,
    required: true,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 200,
    description: `Item of resource "${entityName}" has been updated`,
    schema: jsonSchemaResponse(entity, mapEntity),
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong body parameters',
    schema: { $ref: getSchemaPath(JsonApiErrorResponseModel) },
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 422,
    description: 'Unprocessable data',
    schema: { $ref: getSchemaPath(JsonApiErrorResponseModel) },
  })(controller, methodName, descriptor);
}
