import { faker } from '@faker-js/faker';
import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { UsersAcl } from '../../../entities/acl-test';

import { BaseFactory } from '../../base-factory';

export class UsersAclFactory extends BaseFactory<UsersAcl> {
  protected entity = UsersAcl;

  protected attrs(): FactorizedAttrs<UsersAcl> {
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
