import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { generateSchema } from '@anatine/zod-openapi';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Type } from '@nestjs/common';

import { EntityClass, ObjectLiteral } from '../../../../types';
import { EntityProps, ZodParams } from '../../types';
import { errorSchema, jsonSchemaResponse } from '../utils';
import { zodPost } from '../../zod';

export function postOne<E extends ObjectLiteral>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  zodParams: ZodParams<E, EntityProps<E>, string>,
  methodName: string
) {
  const entityName = entity.name;
  const {
    typeId,
    typeName,
    fieldWithType,
    propsDb,
    primaryColumn,
    relationArrayProps,
    relationPopsName,
    primaryColumnType,
  } = zodParams;
  ApiOperation({
    summary: `Create item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiBody({
    description: `Json api schema for new "${entityName}" item`,
    schema: generateSchema(
      zodPost(
        typeId,
        typeName,
        fieldWithType,
        propsDb,
        primaryColumn,
        relationArrayProps,
        relationPopsName,
        primaryColumnType
      )
    ) as SchemaObject | ReferenceObject,
    required: true,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 201,
    description: `Item of resource "${entityName}" has been created`,
    schema: jsonSchemaResponse(entity, zodParams),
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
