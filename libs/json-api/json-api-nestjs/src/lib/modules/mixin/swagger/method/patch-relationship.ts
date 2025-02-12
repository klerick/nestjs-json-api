import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { generateSchema } from '@anatine/zod-openapi';
import { Type } from '@nestjs/common';

import { EntityClass, ObjectLiteral } from '../../../../types';
import { TypeField, ZodEntityProps } from '../../types';
import {
  errorSchema,
  getEntityMapProps,
  schemaTypeForRelation,
} from '../utils';
import { zodPatchRelationship } from '../../zod';

export function patchRelationship<E extends ObjectLiteral>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  mapEntity: Map<EntityClass<E>, ZodEntityProps<E>>,
  methodName: string
) {
  const entityName = entity.name;

  const { relations, primaryColumnType } = getEntityMapProps(mapEntity, entity);

  ApiOperation({
    summary: `Update list of relation for resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller.prototype, methodName, descriptor);

  ApiParam({
    name: 'id',
    required: true,
    type: primaryColumnType === TypeField.number ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, methodName, descriptor);

  ApiParam({
    name: 'relName',
    required: true,
    type: 'string',
    enum: relations,
    description: `Relation name of resource "${entityName}"`,
  })(controller.prototype, methodName, descriptor);

  ApiBody({
    description: `Json api schema for update "${entityName}" item`,
    schema: generateSchema(zodPatchRelationship) as
      | SchemaObject
      | ReferenceObject,
    required: true,
  })(controller.prototype, methodName, descriptor);

  ApiResponse({
    status: 200,
    schema: schemaTypeForRelation,
    description: `Item/s of relation for "${entityName}" has been updated`,
  })(controller.prototype, methodName, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong url parameters',
    schema: errorSchema,
  })(controller.prototype, methodName, descriptor);

  ApiResponse({
    status: 422,
    description: 'Incorrect type for relation',
    schema: errorSchema,
  })(controller.prototype, methodName, descriptor);

  ApiResponse({
    status: 404,
    description: 'Resource not found ',
    schema: errorSchema,
  })(controller.prototype, methodName, descriptor);
}
