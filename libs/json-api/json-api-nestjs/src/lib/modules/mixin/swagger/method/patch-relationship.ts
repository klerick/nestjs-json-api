import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { z } from 'zod';
import { Type } from '@nestjs/common';
import { EntityClass } from '@klerick/json-api-nestjs-shared';

import { TypeField } from '../../../../types';
import { errorSchema, schemaTypeForRelation } from '../utils';
import { zodPatchRelationship } from '../../zod';
import { EntityParamMapService } from '../../service';

export function patchRelationship<
  E extends object,
  IdKey extends string = 'id'
>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>,
  methodName: string
) {
  const entityName = entity.name;

  const { relations, primaryColumnType } = mapEntity.getParamMap(entity);

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
    enum: relations as any,
    description: `Relation name of resource "${entityName}"`,
  })(controller.prototype, methodName, descriptor);

  ApiBody({
    description: `Json api schema for update "${entityName}" item`,
    schema: z.toJSONSchema(zodPatchRelationship) as
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
