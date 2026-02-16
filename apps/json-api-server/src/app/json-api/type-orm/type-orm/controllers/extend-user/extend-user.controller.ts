import {
  Get,
  Param,
  Inject,
  Query,
  UseInterceptors,
  UseFilters,
  UseGuards,
  Body,
} from '@nestjs/common';

import {
  JsonApi,
  JsonBaseController,
  InjectService,
  JsonApiService,
  Query as QueryType,
  QueryOne,
  PatchRelationshipData,
  PostData,
} from '@klerick/json-api-nestjs';
import {
  ResourceObjectRelationships,
  ResourceObject,
  RelationKeys,
} from '@klerick/json-api-nestjs-shared';
import { ExamplePipe } from '../../service/example.pipe';
import { ExampleService } from '../../service/example.service';
import { MetaTransformPipe } from '../../service/meta-transform.pipe';
import { ControllerInterceptor } from '../../service/controller.interceptor';
import { MethodInterceptor } from '../../service/method.interceptor';
import {
  HttpExceptionFilter,
  HttpExceptionMethodFilter,
} from '../../service/http-exception.filter';
import { GuardService, EntityName } from '../../service/guard.service';

import { Users } from '@nestjs-json-api/typeorm-database';
import { AtomicInterceptor } from '../../service/atomic.interceptor';

@UseGuards(GuardService)
@UseFilters(new HttpExceptionFilter())
@UseInterceptors(ControllerInterceptor)
@JsonApi(Users)
export class ExtendUserController extends JsonBaseController<Users, 'id'> {
  @InjectService() public service!: JsonApiService<Users>;
  @Inject(ExampleService) protected exampleService!: ExampleService;
  override getOne(
    id: string | number,
    query: QueryOne<Users, 'id'>
  ): Promise<ResourceObject<Users>> {
    return super.getOne(id, query);
  }

  patchRelationship<Rel extends RelationKeys<Users>>(
    id: string | number,
    relName: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<Users, 'id', Rel>> {
    return super.patchRelationship(id, relName, input);
  }

  // @UseInterceptors(AtomicInterceptor)
  override async postOne(
    @Body() inputData: PostData<Users, 'id'>,
    @Body(new MetaTransformPipe()) meta: Record<string, unknown>
  ): Promise<ResourceObject<Users, 'object', Record<string, unknown>, 'id'>> {
    // Apply prefix to firstName if meta.prefix is provided
    if (meta?.prefix && typeof meta.prefix === 'string' && inputData.attributes) {
      const firstName = inputData.attributes.firstName;
      if (firstName) {
        inputData.attributes.firstName = `${meta.prefix}${firstName}`;
      }
    }

    const response = await super.postOne(inputData, meta);
    return {
      ...response,
      meta: {
        ...response.meta,
        ...meta,
      },
    };
  }

  @EntityName('Users')
  @UseFilters(HttpExceptionMethodFilter)
  @UseInterceptors(MethodInterceptor)
  getAll(
    @Query(ExamplePipe) query: QueryType<Users, 'id'>
  ): Promise<ResourceObject<Users, 'array'>> {
    return super.getAll(query);
  }

  @Get(':id/example')
  testOne(@Param('id') id: string): string {
    return this.exampleService.testMethode(id);
  }
}
