import { define } from 'typeorm-seeding';
import * as faker from 'faker';

import { Addresses } from '../entities';


define(Addresses, () => {
  const addresses = new Addresses();
  addresses.city = faker.address.city();
  addresses.state = faker.address.state();
  addresses.country = faker.address.country();

  return addresses;
});
