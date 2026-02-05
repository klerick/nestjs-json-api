import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

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
