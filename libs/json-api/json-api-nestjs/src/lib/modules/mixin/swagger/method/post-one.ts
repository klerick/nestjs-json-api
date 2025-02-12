import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { generateSchema } from '@anatine/zod-openapi';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Type } from '@nestjs/common';

import { EntityClass, ObjectLiteral } from '../../../../types';
import { ZodEntityProps } from '../../types';
import { errorSchema, jsonSchemaResponse } from '../utils';
import { zodPost } from '../../zod';
import { getParamsForOatchANdPostZod } from '../../factory';

export function postOne<E extends ObjectLiteral>(
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
    summary: `Create item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiBody({
    description: `Json api schema for new "${entityName}" item`,
    schema: generateSchema(
      zodPost(
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
