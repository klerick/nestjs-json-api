import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ObjectTyped, EntityClass } from '@klerick/json-api-nestjs-shared';
import { Type } from '@nestjs/common';

import { jsonSchemaResponse, zodToOpenApiSchema } from '../utils';
import { zodFieldsInputQuerySwagger } from '../../zod';
import { TypeField } from '../../../../types';
import { EntityParamMapService } from '../../service';
import { JsonApiErrorResponseModel } from '../error-response-model';

export function getOne<E extends object, IdKey extends string = 'id'>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  mapEntity: EntityParamMapService<E, IdKey>,
  methodName: string
) {
  const entityName = entity.name;

  const {
    props,
    relations,
    relationProperty,
    primaryColumnName,
    primaryColumnType,
  } = mapEntity.getParamMap(entity);

  const entityRelationStructure = ObjectTyped.entries(relationProperty).reduce(
    (acum, [name, props]) => {
      const relMap = mapEntity.getParamMap(props.entityClass as any);
      acum[name] = relMap.props;
      return acum;
    },
    {} as any
  );

  ApiOperation({
    summary: `Get one item of resource "${entityName}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
  })(controller, methodName, descriptor);

  ApiParam({
    name: 'id',
    required: true,
    type: primaryColumnType === TypeField.number ? 'integer' : 'string',
    description: `ID of resource "${entityName}"`,
  })(controller, methodName, descriptor);

  ApiQuery({
    name: 'fields',
    required: false,
    style: 'deepObject',
    schema: zodToOpenApiSchema(zodFieldsInputQuerySwagger(mapEntity)),
    examples: {
      allField: {
        summary: 'Select all field',
        description: 'Select field for target and relation',
        value: {
          target: props.join(','),
          ...ObjectTyped.entries(entityRelationStructure).reduce(
            (acum, [name, props]) => {
              acum[name.toString()] = props.join(',');
              return acum;
            },
            {} as Record<string, string>
          ),
        },
      },
      selectOnlyIdsTarget: {
        summary: 'Select ids for target',
        description: 'Select ids for target',
        value: {
          target: props.filter((i) => i === primaryColumnName).join(','),
        },
      },
    },
    description: `Object of field for select field from "${entity.name}" resource`,
  })(controller, methodName, descriptor);

  if (relations.length > 0) {
    ApiQuery({
      name: 'include',
      required: false,
      enum: relations as any,
      style: 'simple',
      isArray: true,
      description: `"${entity.name}" resource item has been extended with existing relations`,
      examples: {
        withInclude: {
          summary: 'Add all relation',
          description: 'Add all realtion',
          value: relations,
        },
        without: {
          summary: 'Without relation',
          description: 'Without all relation',
          value: [],
        },
      },
    })(controller, methodName, descriptor);
  }
  ApiResponse({
    status: 404,
    description: `Item of resource "${entityName}" not found`,
    schema: { $ref: getSchemaPath(JsonApiErrorResponseModel) },
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong query parameters',
    schema: { $ref: getSchemaPath(JsonApiErrorResponseModel) },
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 200,
    description: 'Resource one item received successfully',
    schema: jsonSchemaResponse(entity, mapEntity),
  })(controller, methodName, descriptor);
}
