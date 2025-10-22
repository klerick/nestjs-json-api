import { Seeder } from '@jorgebodega/typeorm-seeding';
import { DataSource } from 'typeorm';

import { AddressesFactory, RolesFactory, UserFactory } from './factory';
import { faker, Sex } from '@faker-js/faker';

export default class RootSeeder extends Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const roles = await new RolesFactory(dataSource).createMany(3);
    const managers = await new UserFactory(dataSource).createMany(10, {
      login: () => {
        const gender = faker.helpers.arrayElement([Sex.Male, Sex.Female])
        const firstName = faker.person.firstName(gender);
        const lastName = faker.person.lastName(gender);
        return `manager:${faker.internet.username({ firstName, lastName })}`
      },
      roles: () => faker.helpers.arrayElements(roles, { min: 1, max: roles.length }),
    });
    await new UserFactory(dataSource).createMany(10, {
      roles: () => faker.helpers.arrayElements(roles, { min: 1, max: roles.length }),
      manager: () => managers.shift() as any,
    });
    await new AddressesFactory(dataSource).createMany(10);

    // await new UserFactory(dataSource).createMany(10);
    // await new AddressesFactory(dataSource).createMany(10);
  }
}
