import { faker, Sex } from '@faker-js/faker';
import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Users } from '../../../entities';
import { BaseFactory } from '../../base-factory';


export class UsersFactory extends BaseFactory<Users> {
  protected entity = Users;
  protected genderList: Record<number, Sex> = {
    [0]: Sex.Male,
    [1]: Sex.Female,
  };

  protected attrs(): FactorizedAttrs<Users> {
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
