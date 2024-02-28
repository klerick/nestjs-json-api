import { FactorizedAttrs, Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';

import { Addresses } from '../../entities';
import { DataSource } from 'typeorm';

export class AddressesFactory extends Factory<Addresses> {
  protected entity = Addresses;
  protected attrs(): FactorizedAttrs<Addresses> {
    return {
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
    };
  }

  constructor(protected dataSource: DataSource) {
    super();
  }
}
