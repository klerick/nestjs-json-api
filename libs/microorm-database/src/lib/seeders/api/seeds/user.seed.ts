import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import { ApiContext } from '../api.seed';

import {
  UsersFactory,
  AddressesFactory,
  BookListFactory,
  CommentsFactory,
} from '../factory';
import { faker } from '@faker-js/faker';

export class UsersSeed extends Seeder {
  async run(em: EntityManager, context: ApiContext) {
    const { roles } = context.apiContext;

    const manager = await new UsersFactory(em)
      .each((user) => {
        user.addresses = new AddressesFactory(em).makeOne();
        user.roles.set(
          faker.helpers.arrayElements(roles, {
            min: 1,
            max: roles.length,
          })
        );
        user.login = 'manager:' + user.login;
        user.books.set(new BookListFactory(em).make(3));
      })
      .create(3);

    await new UsersFactory(em)
      .each((user) => {
        user.addresses = new AddressesFactory(em).makeOne();
        user.roles.set(
          faker.helpers.arrayElements(roles, {
            min: 1,
            max: roles.length,
          })
        );
        user.books.set(new BookListFactory(em).make(3));
        user.manager = manager.shift()!;
      })
      .create(manager.length);
    await new UsersFactory(em)
      .each((user) => {
        user.addresses = new AddressesFactory(em).makeOne();
        user.roles.set(
          faker.helpers.arrayElements(roles, {
            min: 1,
            max: roles.length,
          })
        );
        user.login = 'without-manager:' + user.login;
        user.books.set(new BookListFactory(em).make(3));
        user.comments.set(new CommentsFactory(em).make(3));
      })
      .create(manager.length);
  }
}
