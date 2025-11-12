import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { UserProfileAcl } from '../../../entities/acl-test';

export class UserProfileFactory extends Factory<UserProfileAcl> {
  model = UserProfileAcl;

  definition(): Partial<UserProfileAcl> {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      bio: faker.lorem.sentence(),
      avatar: faker.image.avatar(),
      phone: faker.phone.number(),
      salary: faker.number.int({ min: 50000, max: 150000 }),
      isPublic: faker.datatype.boolean(),
    };
  }
}
