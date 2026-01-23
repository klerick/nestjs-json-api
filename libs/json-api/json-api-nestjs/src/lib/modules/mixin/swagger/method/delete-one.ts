import { Type } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { EntityClass } from '@klerick/json-api-nestjs-shared';

import { TypeField } from '../../../../types';
import { EntityParamMapService } from '../../service';
import { JsonApiErrorResponseModel } from '../error-response-model';

export function deleteOne<E extends object, IdKey extends string = 'id'>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>,
  methodName: string
) {
  const entityName = entity.name;

  const { primaryColumnType } = mapEntity.getParamMap(entity);

  ApiParam({
    name: 'id',
    required: true,
    type: primaryColumnType === TypeField.number ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, methodName, descriptor);

  ApiOperation({
    summary: `Delete item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 404,
    description: `Item of resource "${entityName}" not found`,
    schema: { $ref: getSchemaPath(JsonApiErrorResponseModel) },
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 204,
    description: `Item of resource "${entityName}" has been deleted`,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong query parameters',
    schema: { $ref: getSchemaPath(JsonApiErrorResponseModel) },
  })(controller, methodName, descriptor);
}
