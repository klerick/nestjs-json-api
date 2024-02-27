import { ParseUUIDPipe } from '@nestjs/common';
import { BookList } from 'database';
import { JsonApi, JsonBaseController } from 'json-api-nestjs';

@JsonApi(BookList, {
  pipeForId: ParseUUIDPipe,
  overrideRoute: 'override-book-list',
  allowMethod: ['getOne', 'postOne', 'deleteOne'],
})
export class ExtendBookListController extends JsonBaseController<BookList> {}
