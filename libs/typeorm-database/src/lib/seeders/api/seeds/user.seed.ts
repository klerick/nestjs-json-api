import { faker } from '@faker-js/faker';
import {
  CollectionSubfactory,
  SingleSubfactory,
} from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';

import { ApiContext } from '../api.seed';

import {
  UsersFactory,
  AddressesFactory,
  BookListFactory,
  CommentsFactory,
} from '../factory';

import { BaseSeeder } from '../../base-seeder';


export class UsersSeed extends BaseSeeder {
  async run(dataSource: DataSource, context: ApiContext) {
    const { roles } = context.apiContext;

    const manager = await new UsersFactory(dataSource)
      .each((user) => {
        user.addresses = new SingleSubfactory(new AddressesFactory(dataSource));
        user.roles = () =>
          faker.helpers.arrayElements(roles, { min: 1, max: roles.length });
        user.login = 'manager:' + user.login;
        user.books = new CollectionSubfactory(
          new BookListFactory(dataSource),
          faker.number.int(20)
        );
      })
      .createMany(3);

    await new UsersFactory(dataSource)
      .each((user) => {
        user.addresses = new SingleSubfactory(new AddressesFactory(dataSource));
        user.roles = () =>
          faker.helpers.arrayElements(roles, { min: 1, max: roles.length });
        user.books = new CollectionSubfactory(
          new BookListFactory(dataSource),
          faker.number.int(20)
        );
        user.manager = manager.shift()!;
      })
      .createMany(manager.length);

    await new UsersFactory(dataSource)
      .each((user) => {
        user.addresses = new SingleSubfactory(new AddressesFactory(dataSource));
        user.roles = () =>
          faker.helpers.arrayElements(roles, { min: 1, max: roles.length });
        user.login = 'without-manager:' + user.login;
        user.books = new CollectionSubfactory(
          new BookListFactory(dataSource),
          faker.number.int(20)
        );
        user.comments = new CollectionSubfactory(
          new CommentsFactory(dataSource),
          faker.number.int(100)
        );
      })
      .createMany(manager.length);
  }
}
