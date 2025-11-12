import { DataSource } from 'typeorm';
import { Context } from '../database.seeder';
import { Roles } from '../../entities';
import { BaseSeeder } from '../base-seeder';

import { RolesSeed, UsersSeed } from './seeds';

export type InnerApiContext = {
  roles: Roles[];
};

export type ApiContext = Context & { apiContext: InnerApiContext };

export class ApiSeeder extends BaseSeeder{

  async run(dataSource: DataSource, context: Context = {}): Promise<void> {
    const innerContext: InnerApiContext = {
      roles: [],
    };
    const apiContext = {
      ...context,
      apiContext: innerContext,
    };

    await this.call(dataSource, [RolesSeed], apiContext);
    await this.call(dataSource, [UsersSeed], apiContext);
  }
}
