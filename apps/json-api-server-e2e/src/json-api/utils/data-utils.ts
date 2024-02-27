import { Users } from 'database';
import { faker } from '@faker-js/faker';

export const getUser = () => {
  const user = new Users();
  user.firstName = faker.string.alpha(50);
  user.lastName = faker.string.alpha(50);
  user.login = faker.string.alpha(50);
  return user;
};
