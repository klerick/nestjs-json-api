import { Get, Param, Inject } from '@nestjs/common';

import { Users } from 'database';
import {
  JsonApi,
  excludeMethod,
  JsonBaseController,
  InjectService,
  JsonApiService,
  QueryParams,
} from 'json-api-nestjs';
import { ExampleService } from '../../service/example/example.service';

@JsonApi(Users, {
  allowMethod: excludeMethod(['deleteRelationship']),
  requiredSelectField: true,
})
export class ExtendUserController extends JsonBaseController<Users> {
  @InjectService() public service: JsonApiService<Users>;
  @Inject(ExampleService) protected exampleService: ExampleService;

  public override getAll(query: QueryParams<Users>) {
    return this.service.getAll({ query });
  }

  @Get(':id/example')
  testOne(@Param('id') id: string): string {
    return this.exampleService.testMethode(id);
  }
}
