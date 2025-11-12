import { Factory } from '@mikro-orm/seeder';
import { faker, Sex } from '@faker-js/faker';
import { Users } from '../../../entities';

export class UsersFactory extends Factory<Users> {
  model = Users;
  protected genderList: Record<number, Sex> = {
    [0]: Sex.Male,
    [1]: Sex.Female,
  };

  definition(): Partial<Users> {
    const gender: Sex = this.genderList[faker.number.int(1)];

    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName(gender);
    return {
      login: faker.internet.username({ firstName, lastName }),
      firstName: firstName,
      lastName: lastName,
      isActive: faker.datatype.boolean(),
    };
  }
}
