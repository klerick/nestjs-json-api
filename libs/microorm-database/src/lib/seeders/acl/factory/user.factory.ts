import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { UsersAcl } from '../../../entities/acl-test';

export class UsersAclFactory extends Factory<UsersAcl> {
  model = UsersAcl;

  definition(): Partial<UsersAcl> {
    const info = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    }
    return {
      login: faker.internet.username(info).toLowerCase(),
      isActive: true,
      ...info
    };
  }
}
