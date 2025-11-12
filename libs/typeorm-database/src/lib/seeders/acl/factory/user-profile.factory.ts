import { faker } from '@faker-js/faker';
import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';

import { UserProfileAcl } from '../../../entities/acl-test';
import { BaseFactory } from '../../base-factory';


export class UserProfileFactory extends BaseFactory<UserProfileAcl> {
  entity = UserProfileAcl;

  protected attrs(): FactorizedAttrs<UserProfileAcl> {
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
