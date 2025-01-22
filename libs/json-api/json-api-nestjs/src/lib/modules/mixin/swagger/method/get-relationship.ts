import { EntityClass, EntityTarget, ObjectLiteral } from '../../../../types';
import { Type } from '@nestjs/common';
import { EntityProps, TypeField, ZodParams } from '../../types';
import { errorSchema, schemaTypeForRelation } from '../utils';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function getRelationship<E extends ObjectLiteral>(
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
    summary: `Get list of relation for resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
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

  ApiResponse({
    status: 200,
    schema: schemaTypeForRelation,
    description: `Item/s of relation for "${entityName}" has been created`,
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
}
