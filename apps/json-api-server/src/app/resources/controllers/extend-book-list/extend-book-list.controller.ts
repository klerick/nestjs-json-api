import { ParseUUIDPipe } from '@nestjs/common';
import { BookList } from '../entity-orm';
import { JsonApi, JsonBaseController } from '@klerick/json-api-nestjs';

@JsonApi(BookList as any, {
  pipeForId: ParseUUIDPipe,
  overrideRoute: 'override-book-list',
  allowMethod: ['getOne', 'postOne', 'deleteOne'],
})
export class ExtendBookListController extends JsonBaseController<
  typeof BookList
> {}
