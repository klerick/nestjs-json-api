import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { FilterOperand as FilterOperandType } from '@klerick/json-api-nestjs-shared';
import { OperandsMapTitle } from './filter-operand-model';

export const errorSchema = {
  type: 'object',
  properties: {
    statusCode: {
      type: 'number',
    },
    error: {
      type: 'string',
    },
    message: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
          },
          message: {
            type: 'string',
          },
          path: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          keys: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['code', 'message', 'path'],
      },
    },
  },
};

const ErrorMessageItemSchema = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
    },
    message: {
      type: 'string',
    },
    path: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    keys: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['code', 'message', 'path'],
};

export class JsonApiErrorMessageItem {
  @ApiProperty({ type: 'string', title: 'Error code' })
  code!: string;

  @ApiProperty({ type: 'string', title: 'Error message' })
  message!: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    title: 'Path to the error field',
  })
  path!: string[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    required: false,
    title: 'Additional keys',
  })
  keys?: string[];
}

@ApiExtraModels(JsonApiErrorMessageItem)
export class JsonApiErrorResponseModel {
  @ApiProperty({ type: 'number', title: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({ type: 'string', title: 'Error type' })
  error!: string;

  @ApiProperty({
    type: 'array',
    items: { $ref: getSchemaPath(JsonApiErrorMessageItem) },
    title: 'Error details',
  })
  message!: JsonApiErrorMessageItem[];
}
