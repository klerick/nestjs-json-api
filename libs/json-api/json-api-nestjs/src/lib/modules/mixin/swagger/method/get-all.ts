import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Type } from '@nestjs/common';
import { ObjectTyped } from '@klerick/json-api-nestjs-shared';

import { EntityClass, ObjectLiteral } from '../../../../types';
import { EntityProps, ZodParams } from '../../types';
import { errorSchema, jsonSchemaResponse } from '../utils';
import { DEFAULT_PAGE_SIZE, DEFAULT_QUERY_PAGE } from '../../../../constants';

export function getAll<E extends ObjectLiteral>(
  controller: Type<any>,
  descriptor: PropertyDescriptor,
  entity: EntityClass<E>,
  zodParams: ZodParams<E, EntityProps<E>, string>,
  methodName: string
): void {
  const { entityFieldsStructure, entityRelationStructure, primaryColumn } =
    zodParams;
  const { field, relations } = entityFieldsStructure;

  const relationTree = ObjectTyped.entries(entityRelationStructure).reduce(
    (acum, [name, filed]) => {
      acum.push(...filed.map((i) => `${name.toLocaleString()}.${i}`));
      return acum;
    },
    [] as string[]
  );

  ApiOperation({
    summary: `Get list items of resource "${entity.name}"`,
    operationId: `${controller.constructor.name}_${methodName}`,
    servers: undefined,
  })(controller, methodName, descriptor);

  ApiQuery({
    name: 'fields',
    required: false,
    style: 'deepObject',
    schema: {
      type: 'object',
    },
    examples: {
      allField: {
        summary: 'Select all field',
        description: 'Select field for target and relation',
        value: {
          target: field.join(','),
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
          target: field.filter((i) => i === primaryColumn).join(','),
        },
      },
    },
    description: `Object of field for select field from "${entity.name}" resource`,
  })(controller, methodName, descriptor);

  ApiQuery({
    name: 'filter',
    required: false,
    style: 'deepObject',
    schema: {
      type: 'object',
    },
    examples: {
      simpleExample: {
        summary: 'Several conditional',
        description: 'Get if relation is not null',
        value: {
          [field[0]]: {
            in: '1,2,3',
          },
          [field[1]]: {
            lt: '1',
          },
          [relationTree[0]]: {
            eq: 'test',
          },
        },
      },
      relationNull: {
        summary: 'Get if relation is null',
        description: 'Get if relation is null',
        value: {
          [relations[0]]: {
            eq: null,
          },
        },
      },
      relationNotNull: {
        summary: 'Get if relation is not null',
        description: 'Get if relation is not null',
        value: {
          [relations[0]]: {
            ne: null,
          },
        },
      },
      getRelationByConditional: {
        summary: 'Get if relation field is',
        description: 'Get if relation field is',
        value: {
          [relationTree[0]]: {
            eq: 'test',
          },
        },
      },
    },
    description: `Object of filter for select items from "${entity.name}" resource`,
  })(controller, methodName, descriptor);

  let sortAscRelation = {};
  let sortDescRelation = {};
  let sortSeveral = {
    summary: 'Sort several field',
    description: 'Sort several field',
    value: `${field[1]},-${field[0]}`,
  };

  if (relations.length > 0) {
    ApiQuery({
      name: 'include',
      required: false,
      enum: relations,
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

    sortAscRelation = {
      summary: 'Sort field relation by ASC',
      description: 'Sort field relation by ASC',
      value: relationTree[2],
    };
    sortDescRelation = {
      summary: 'Sort field relation by DESC',
      description: 'Sort field relation by DESC',
      value: `-${relationTree[2]}`,
    };
    sortSeveral = {
      summary: 'Sort several field with relation',
      description: 'Sort several field relation',
      value: `${field[1]},-${relationTree[2]},${relationTree[1]},-${field[0]}`,
    };
  }

  ApiQuery({
    name: 'sort',
    type: 'string',
    required: false,
    description: `Params for sorting of "${entity.name}"`,
    examples: {
      sortAsc: {
        summary: 'Sort field by ASC',
        description: 'Sort field by ASC',
        value: field[1],
      },
      sortDesc: {
        summary: 'Sort field by DESC',
        description: 'Sort field by DESC',
        value: `-${field[1]}`,
      },
      sortAscRelation,
      sortDescRelation,
      sortSeveral,
    },
  })(controller, methodName, descriptor);

  ApiQuery({
    name: 'page',
    style: 'deepObject',
    required: false,
    schema: {
      type: 'object',
      properties: {
        number: {
          type: 'integer',
          minimum: 1,
          example: DEFAULT_QUERY_PAGE,
        },
        size: {
          type: 'integer',
          minimum: 1,
          example: DEFAULT_PAGE_SIZE,
          maximum: 500,
        },
      },
      additionalProperties: false,
    },
    description: `"${entity.name}" resource has been limit and offset with this params.`,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 400,
    description: 'Wrong query parameters',
    schema: errorSchema,
  })(controller, methodName, descriptor);

  ApiResponse({
    status: 200,
    description: 'Resource list received successfully',
    schema: jsonSchemaResponse(entity, zodParams, true),
  })(controller, methodName, descriptor);
}
