import { Comments } from '@nestjs-json-api/microorm-database';
import { InjectRepository } from '@mikro-orm/nestjs';

import { Get } from '@nestjs/common';
import { JsonApi, JsonBaseController } from '@klerick/json-api-nestjs';
import { EntityRepository } from '@mikro-orm/core';

@JsonApi(Comments)
export class CommentsController extends JsonBaseController<Comments, 'id'> {
  @InjectRepository(Comments, 'default') commentsRepository!: EntityRepository<Comments>;
}
