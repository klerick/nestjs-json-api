import { ExampleService } from '../services/example.service';
import {
  InjectService,
  JsonApi,
  JsonApiController,
  JsonApiService,
  QueryParams,
  excludeMethod,
} from 'json-api-nestjs';
import { Users } from 'database';
import { applyDecorators, Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export function TestSwagger() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Data received successfully',
    }),
    ApiResponse({ status: 523, description: 'Origin is unreachable' }),
    ApiOperation({ tags: ['test'] })
  );
}

@JsonApi(Users, {
  allowMethod: excludeMethod(['getAll', 'deleteRelationship']),
})
@ApiTags('Users')
@Controller('users')
export class ExampleController implements JsonApiController {
  public constructor(private readonly exampleService: ExampleService) {}
  @InjectService() protected service: JsonApiService;

  getOne(id: number, params: QueryParams) {
    const tmp = this.exampleService.getHello();
    return this.service.getOne({ route: { id }, query: params });
  }

  @TestSwagger()
  @Get(':id/abc')
  testOne(id: number, params: QueryParams) {
    return 'one works';
  }

  @TestSwagger()
  @Get(':id/def')
  testTwo(id: number, params: QueryParams) {
    return 'two works';
  }
}
