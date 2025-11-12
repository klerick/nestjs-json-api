import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';


import {AclSeed} from './acl/acl.seed';
import {ApiSeeder} from './api/api.seed';

export type Context = {};

export class DatabaseSeeder extends Seeder<Context> {
  async run(em: EntityManager, context: Context = {}): Promise<void> {
    await new ApiSeeder().run(em, context)
    await new AclSeed().run(em, context)

  }
}
