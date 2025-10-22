import { FactorizedAttrs, Factory } from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker'
import { BookList } from '../../entities';

export class BookListFactory extends Factory<BookList> {
  protected entity = BookList;
  protected attrs(): FactorizedAttrs<BookList>{
    return {
      text: faker.book.title()
    }
  }

  constructor(protected dataSource: DataSource) {
    super();
  }
}
