import { ParseUUIDPipe } from '@nestjs/common';
import { BookList } from 'database';
import { JsonApi } from 'json-api-nestjs';

@JsonApi(BookList, {
  pipeForId: ParseUUIDPipe,
})
export class ExtendBookListController {}
