import { Factory } from '@mikro-orm/seeder';
import { Addresses } from '../../../entities';
import { faker } from '@faker-js/faker';

export class AddressesFactory extends Factory<Addresses> {
  model = Addresses;

  definition(): Partial<Addresses> {
    return {
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
    };
  }
}
