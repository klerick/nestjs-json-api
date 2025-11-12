import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import { Context } from '../database.seeder';
import { Roles } from '../../entities';
import { RolesSeed, UsersSeed } from './seeds';

export type InnerApiContext = {
  roles: Roles[];
};

export type ApiContext = Context & { apiContext: InnerApiContext };

export class ApiSeeder extends Seeder {
  async run(em: EntityManager, context: Context = {}): Promise<void> {
    const innerContext: InnerApiContext = {
      roles: [],
    };
    const apiContext = {
      ...context,
      apiContext: innerContext,
    };

    await this.call(em, [RolesSeed], apiContext);
    await this.call(em, [UsersSeed], apiContext);
  }
}
