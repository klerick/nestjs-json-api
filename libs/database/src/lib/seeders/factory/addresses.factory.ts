import {FactorizedAttrs, Factory} from '@jorgebodega/typeorm-factory';
import {faker} from '@faker-js/faker';

import {Addresses} from '../../entities';
import {DataSource} from 'typeorm';


export class AddressesFactory extends Factory<Addresses>{
  protected entity = Addresses;
  protected attrs(): FactorizedAttrs<Addresses> {
    return {
      city: faker.address.city(),
      state: faker.address.state(),
      country: faker.address.country(),
    };
  }

  constructor(protected dataSource: DataSource) {
    super();
  }


}
