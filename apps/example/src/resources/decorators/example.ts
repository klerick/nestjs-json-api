import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Users } from 'database';

export function ExampleSwagger() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Resource received successfully',
      type: Users,
    }),
    ApiResponse({
      status: 523,
      description: 'Origin is unreachable',
    }),
    ApiOperation({
      parameters: [{ name: 'id', in: 'path' }],
    })
  );
}
