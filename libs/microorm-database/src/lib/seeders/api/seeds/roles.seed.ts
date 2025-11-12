import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import { ApiContext } from '../api.seed';

import { RolesFactory } from '../factory';

export class RolesSeed extends Seeder {
  async run(em: EntityManager, context: ApiContext) {
    context.apiContext.roles = await new RolesFactory(em).create(3);
  }
}
