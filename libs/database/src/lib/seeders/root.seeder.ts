import {Seeder} from '@jorgebodega/typeorm-seeding';
import {DataSource} from 'typeorm';

import {AddressesFactory, UserFactory} from './factory'


export default class RootSeeder extends Seeder {
  async run(dataSource: DataSource): Promise<void> {
    await new UserFactory(dataSource).createMany(10);
    await new AddressesFactory(dataSource).createMany(10);
  }

}
