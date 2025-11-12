import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import { BookList } from '../../../entities';
import { BaseFactory } from '../../base-factory';

export class BookListFactory extends BaseFactory<BookList> {
  protected entity = BookList;
  protected attrs(): FactorizedAttrs<BookList> {
    return {
      text: faker.book.title(),
    };
  }
}
