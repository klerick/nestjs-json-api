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
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExampleSwagger } from '../decorators/example';

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

  @ExampleSwagger()
  @Get(':id/example')
  testOne(@Param('id') id) {
    return id;
  }
}
