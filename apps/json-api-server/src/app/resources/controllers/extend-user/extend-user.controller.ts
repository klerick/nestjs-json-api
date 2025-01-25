import {
  Get,
  Param,
  Inject,
  Query,
  UseInterceptors,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import {
  JsonApi,
  JsonBaseController,
  InjectService,
  JsonApiService,
  Query as QueryType,
  ResourceObject,
  EntityRelation,
  PatchRelationshipData,
  ResourceObjectRelationships,
  PostData,
} from '@klerick/json-api-nestjs';
import { ExamplePipe } from '../../service/example.pipe';
import { ExampleService } from '../../service/example.service';
import { ControllerInterceptor } from '../../service/controller.interceptor';
import { MethodInterceptor } from '../../service/method.interceptor';
import {
  HttpExceptionFilter,
  HttpExceptionMethodFilter,
} from '../../service/http-exception.filter';
import { GuardService, EntityName } from '../../service/guard.service';
import { Users } from '../entity-orm';
import { AtomicInterceptor } from '../../service/atomic.interceptor';

@UseGuards(GuardService)
@UseFilters(new HttpExceptionFilter())
@UseInterceptors(ControllerInterceptor)
@JsonApi(Users as any)
export class ExtendUserController extends JsonBaseController<typeof Users> {
  @InjectService() public service: JsonApiService<typeof Users>;
  @Inject(ExampleService) protected exampleService: ExampleService;
  getOne(
    id: string | number,
    query: QueryType<typeof Users>
  ): Promise<ResourceObject<typeof Users>> {
    return super.getOne(id, query);
  }

  patchRelationship<Rel extends EntityRelation<typeof Users>>(
    id: string | number,
    relName: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<typeof Users, Rel>> {
    return super.patchRelationship(id, relName, input);
  }

  // @UseInterceptors(AtomicInterceptor)
  postOne(
    inputData: PostData<typeof Users>
  ): Promise<ResourceObject<typeof Users>> {
    return super.postOne(inputData);
  }

  @EntityName('Users')
  @UseFilters(HttpExceptionMethodFilter)
  @UseInterceptors(MethodInterceptor)
  getAll(
    @Query(ExamplePipe) query: QueryType<typeof Users>
  ): Promise<ResourceObject<typeof Users, 'array'>> {
    return super.getAll(query);
  }

  @Get(':id/example')
  testOne(@Param('id') id: string): string {
    return this.exampleService.testMethode(id);
  }
}
