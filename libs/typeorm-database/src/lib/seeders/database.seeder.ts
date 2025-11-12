import { Seeder } from '@jorgebodega/typeorm-seeding';
import { DataSource } from 'typeorm';

import { ApiSeeder } from './api/api.seed';
import { AclSeed } from './acl/acl.seed';
export type Context = {};

export default class DatabaseSeeder extends Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const context: Context = {};
    await new ApiSeeder().run(dataSource, context)
    await new AclSeed().run(dataSource, context);
  }
}
