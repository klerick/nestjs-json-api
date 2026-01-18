import { Comments } from '@nestjs-json-api/typeorm-database';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Get } from '@nestjs/common';
import { JsonApi, JsonBaseController } from '@klerick/json-api-nestjs';

@JsonApi(Comments)
export class CommentsController extends JsonBaseController<Comments, 'id'> {
  @InjectRepository(Comments) commentsRepository!: Repository<Comments>;
}
