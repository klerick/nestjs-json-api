import { Comments } from '@nestjs-json-api/microorm-database';
import { InjectRepository } from '@mikro-orm/nestjs';

import {
  JsonApi,
  JsonBaseController,
  PostData,
  patchInputData,
} from '@klerick/json-api-nestjs';
import {
  ResourceObject,
} from '@klerick/json-api-nestjs-shared';
import { EntityRepository } from '@mikro-orm/core';

@JsonApi(Comments)
export class CommentsController extends JsonBaseController<Comments, 'id'> {
  @InjectRepository(Comments, 'default')
  commentsRepository!: EntityRepository<Comments>;

  override postOne(
    inputData: PostData<Comments, 'id'>
  ): Promise<ResourceObject<Comments>> {
    const patchedInputData = patchInputData(inputData, {
      updatedAt: new Date(),
    });

    return super.postOne(patchedInputData);
  }
}
