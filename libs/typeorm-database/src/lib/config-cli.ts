import { DataSource } from 'typeorm';

const configSeeder = {
  seeders: ['./libs/database/src/lib/seeders/*.ts'],
  defaultSeeder: 'RootSeeder',
};

import { join } from 'node:path';
import { pgConfig } from './config-db';

export default new DataSource({
  ...pgConfig,
  ...configSeeder,
  migrations: [join(__dirname, '/migrations-pg/**/*{.ts,.js}')],
});
