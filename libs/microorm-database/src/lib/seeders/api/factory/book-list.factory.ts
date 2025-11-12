import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { BookList } from '../../../entities';

export class BookListFactory extends Factory<BookList> {
  model = BookList;

  definition(): Partial<BookList> {
    return {
      text: faker.book.title(),
    };
  }
}
