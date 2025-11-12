import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';

import { Addresses } from '../../../entities';
import { BaseFactory } from '../../base-factory';

export class AddressesFactory extends BaseFactory<Addresses> {
  protected entity = Addresses;
  protected attrs(): FactorizedAttrs<Addresses> {
    return {
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
    };
  }
}
