import { define } from 'typeorm-seeding';
import * as faker from 'faker';

import { Users } from '../entities';


define(Users, () => {
  const gender = faker.datatype.number(1);
  const firstName = faker.name.firstName(gender);
  const lastName = faker.name.lastName(gender);

  const user = new Users();
  user.login = faker.internet.userName(firstName, lastName);
  user.isActive = faker.datatype.boolean();
  user.firstName = firstName;
  user.lastName = lastName;

  return user;
});
