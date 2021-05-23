import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import * as faker from 'faker';

import { Comments } from '../entities';

export default class LinkMaintenanceToStatesSeed implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {

    await factory(Comments)()
      .map(async (item) => {
        return item;
      })
      .createMany(faker.datatype.number(3));
  }
}
