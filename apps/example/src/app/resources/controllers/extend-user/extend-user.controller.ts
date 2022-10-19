import { Get, Param, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
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
import { map } from 'rxjs';

@JsonApi(Users, {
  allowMethod: excludeMethod(['deleteRelationship']),
  requiredSelectField: false,
})
export class ExtendUserController extends JsonBaseController<Users> {
  @InjectService() public service: JsonApiService<Users>;
  @Inject(ExampleService) protected exampleService: ExampleService;
  @Inject(HttpService) protected httpService: HttpService;

  public override getAll(query: QueryParams<Users>) {
    return this.service.getAll({ query });
  }

  @Get(':id/example')
  testOne(@Param('id') id: string): string {
    return this.exampleService.testMethode(id);
  }

  @Get('test-http')
  testHttp() {
    return this.httpService
      .get('http://localhost:3333/api/v1/book-list')
      .pipe(map((r) => r.data));
  }
}
