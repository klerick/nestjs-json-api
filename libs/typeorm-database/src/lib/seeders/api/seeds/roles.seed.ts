import { DataSource } from 'typeorm';

import { ApiContext } from '../api.seed';
import { RolesFactory } from '../factory';
import { BaseSeeder } from '../../base-seeder';


export class RolesSeed extends BaseSeeder {
  async run(dataSource: DataSource, context: ApiContext) {
    context.apiContext.roles = await new RolesFactory(dataSource).createMany(3);
  }
}
