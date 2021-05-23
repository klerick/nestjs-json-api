import { Factory, Seeder } from 'typeorm-seeding';
import { Connection, Not } from 'typeorm';
import * as faker from 'faker';

import {
  Addresses,
  Users,
  Roles,
} from '../entities';


export default class UsersSeed implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const roles = await connection.getRepository(Roles).find({
      where: {
        key: Not('SUPPORT'),
      }
    });

    // Supervisors creation
    await factory(Users)()
      .map(async (user: Users): Promise<Users> => {
        user.addresses = await factory(Addresses)().create();
        user.roles = [faker.random.arrayElement(roles)];
        return user;
      })
      .createMany(20);

    // General users creation
    const supervisors = await connection.getRepository(Users).find();
    await factory(Users)()
      .map(async (user: Users): Promise<Users> => {
        const supervisor = faker.random.arrayElement(supervisors);
        user.manager = supervisor;
        user.addresses = await factory(Addresses)().create();
        user.roles = [faker.random.arrayElement(roles)];
        return user;
      })
      .createMany(150);
  }
}
