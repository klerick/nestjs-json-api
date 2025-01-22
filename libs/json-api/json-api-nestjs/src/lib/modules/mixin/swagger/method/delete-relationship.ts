import { EntityClass, ObjectLiteral } from '../../../../types';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

import { EntityProps, TypeField, ZodParams } from '../../types';
import { zodPatchRelationship } from '../../zod';
import { errorSchema } from '../utils';
import { generateSchema } from '@anatine/zod-openapi';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export function deleteRelationship<E extends ObjectLiteral>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  zodParams: ZodParams<E, EntityProps<E>, string>,
  methodName: string
) {
  const entityName = entity.name;

  const {
    entityFieldsStructure: { relations },
    typeId,
  } = zodParams;

  ApiOperation({
    summary: `Delete list of relation for resource "${entityName}"`,
    operationId: `${controller.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiParam({
    name: 'id',
    required: true,
    type: typeId === TypeField.number ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, methodName, descriptor);

  ApiParam({
    name: 'relName',
    required: true,
    type: 'string',
    enum: relations,
    description: `Relation name of resource "${entityName}"`,
  })(controller, methodName, descriptor);

  ApiBody({
    description: `Json api schema for delete "${entityName}" item`,
    schema: generateSchema(zodPatchRelationship) as
      | SchemaObject
      | ReferenceObject,
    required: true,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong url parameters',
    schema: errorSchema,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 422,
    description: 'Incorrect type for relation',
    schema: errorSchema,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 404,
    description: 'Resource not found ',
    schema: errorSchema,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 204,
    description: `Item/s of relation for "${entityName}" has been deleted`,
  })(controller, methodName, descriptor);
}
