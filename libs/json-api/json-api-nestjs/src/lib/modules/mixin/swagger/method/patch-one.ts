import { Type } from '@nestjs/common';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { generateSchema } from '@anatine/zod-openapi';

import { EntityClass, ObjectLiteral } from '../../../../types';
import { TypeField, ZodEntityProps } from '../../types';
import { errorSchema, jsonSchemaResponse } from '../utils';
import { zodPatch } from '../../zod';
import { getParamsForOatchANdPostZod } from '../../factory';

export function patchOne<E extends ObjectLiteral>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  mapEntity: Map<EntityClass<E>, ZodEntityProps<E>>,
  methodName: string
) {
  const entityName = entity.name;

  const {
    primaryColumnType,
    typeName,
    fieldWithType,
    propsDb,
    primaryColumnName,
    relationArrayProps,
    relationPopsName,
    primaryColumnTypeForRel,
  } = getParamsForOatchANdPostZod<E>(mapEntity, entity);

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
    schema: generateSchema(
      zodPatch(
        primaryColumnType,
        typeName,
        fieldWithType,
        propsDb,
        primaryColumnName,
        relationArrayProps,
        relationPopsName,
        primaryColumnTypeForRel
      )
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
    schema: errorSchema,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 422,
    description: 'Unprocessable data',
    schema: errorSchema,
  })(controller, methodName, descriptor);
}
