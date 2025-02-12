import {
  FactorizedAttrs,
  Factory,
  CollectionSubfactory,
  SingleSubfactory,
} from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';
import { faker, Sex, Faker } from '@faker-js/faker';

import { Users } from '../../entities';
import { AddressesFactory, CommentsFactory } from '.';

export class UserFactory extends Factory<Users> {
  protected genderList: Record<number, Sex> = {
    [0]: Sex.Male,
    [1]: Sex.Female,
  };

  protected entity = Users;
  protected attrs(): FactorizedAttrs<Users> {
    const gender: Sex = this.genderList[faker.number.int(1)];

    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName(gender);
    return {
      login: faker.internet.userName({ firstName, lastName }),
      isActive: faker.datatype.boolean(),
      firstName: firstName,
      lastName: lastName,
      comments: new CollectionSubfactory(
        new CommentsFactory(this.dataSource),
        faker.number.int(100)
      ),
      addresses: new SingleSubfactory(new AddressesFactory(this.dataSource)),
    };
  }

  constructor(protected dataSource: DataSource) {
    super();
  }
}
