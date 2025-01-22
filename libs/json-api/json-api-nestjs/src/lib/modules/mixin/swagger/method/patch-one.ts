import { Type } from '@nestjs/common';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { generateSchema } from '@anatine/zod-openapi';

import { EntityClass, ObjectLiteral } from '../../../../types';
import { EntityProps, TypeField, ZodParams } from '../../types';
import { errorSchema, jsonSchemaResponse } from '../utils';
import { zodPatch } from '../../zod';

export function patchOne<E extends ObjectLiteral>(
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
    summary: `Update item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiParam({
    name: 'id',
    required: true,
    type: typeId === TypeField.number ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, methodName, descriptor);

  ApiBody({
    description: `Json api schema for update "${entityName}" item`,
    schema: generateSchema(
      zodPatch(
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
    status: 200,
    description: `Item of resource "${entityName}" has been updated`,
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
