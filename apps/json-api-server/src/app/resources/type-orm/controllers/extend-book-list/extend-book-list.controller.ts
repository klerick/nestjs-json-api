import { ParseUUIDPipe } from '@nestjs/common';
import { JsonApi, JsonBaseController } from '@klerick/json-api-nestjs';

import { BookList } from '@nestjs-json-api/typeorm-database';
@JsonApi(BookList, {
  pipeForId: ParseUUIDPipe,
  overrideRoute: 'override-book-list',
  allowMethod: ['getOne', 'postOne', 'deleteOne'],
})
export class ExtendBookListController extends JsonBaseController<BookList> {}
