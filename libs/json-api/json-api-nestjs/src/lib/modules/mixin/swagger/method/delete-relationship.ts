import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { Type } from '@nestjs/common';
import { EntityClass } from '@klerick/json-api-nestjs-shared';

import { TypeField } from '../../../../types';
import { zodPatchRelationship } from '../../zod';
import { errorSchema } from '../utils';

import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { EntityParamMapService } from '../../service';

export function deleteRelationship<
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
    summary: `Delete list of relation for resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

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
  })(controller, methodName, descriptor);

  ApiBody({
    description: `Json api schema for delete "${entityName}" item`,
    schema: z.toJSONSchema(zodPatchRelationship) as
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
