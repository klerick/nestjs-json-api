import { Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { EntityClass } from '@klerick/json-api-nestjs-shared';

import { TypeField } from '../../../../types';
import { schemaTypeForRelation } from '../utils';
import { EntityParamMapService } from '../../service';
import { JsonApiErrorResponseModel } from '../error-response-model';

export function getRelationship<E extends object, IdKey extends string = 'id'>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>,
  methodName: string
) {
  const entityName = entity.name;

  const { relations, primaryColumnType } = mapEntity.getParamMap(entity);

  ApiOperation({
    summary: `Get list of relation for resource "${entityName}"`,
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

  ApiResponse({
    status: 200,
    schema: schemaTypeForRelation,
    description: `Item/s of relation for "${entityName}" has been created`,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong url parameters',
    schema: { $ref: getSchemaPath(JsonApiErrorResponseModel) },
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 422,
    description: 'Incorrect type for relation',
    schema: { $ref: getSchemaPath(JsonApiErrorResponseModel) },
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 404,
    description: 'Resource not found ',
    schema: { $ref: getSchemaPath(JsonApiErrorResponseModel) },
  })(controller, methodName, descriptor);
}
