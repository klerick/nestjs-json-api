import { EntityClass, EntityTarget, ObjectLiteral } from '../../../../types';
import { Type } from '@nestjs/common';
import { EntityProps, TypeField, ZodParams } from '../../types';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { errorSchema } from '../utils';

export function deleteOne<E extends ObjectLiteral>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  zodParams: ZodParams<E, EntityProps<E>, string>,
  methodName: string
) {
  const entityName = entity.name;

  const { typeId } = zodParams;

  ApiParam({
    name: 'id',
    required: true,
    type: typeId === TypeField.number ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, methodName, descriptor);

  ApiOperation({
    summary: `Delete item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 404,
    description: `Item of resource "${entityName}" not found`,
    schema: errorSchema,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 204,
    description: `Item of resource "${entityName}" has been deleted`,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong query parameters',
    schema: errorSchema,
  })(controller, methodName, descriptor);
}
