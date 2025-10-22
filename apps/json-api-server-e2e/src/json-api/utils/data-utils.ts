import { Users } from '@nestjs-json-api/typeorm-database';
import { faker, Sex } from '@faker-js/faker';

export const getUser = () => {

  // const gender: Sex = this.genderList[faker.number.int(1)];
  //
  // const firstName = faker.person.firstName(gender);
  // const lastName = faker.person.lastName(gender);

  const user = new Users();
  user.firstName = faker.string.alpha(50);
  user.lastName = faker.string.alpha(50);
  user.login = faker.string.alpha(50);
  return user;
};
