import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

const config: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'example_new',
  logging: true,
  migrations: [join(__dirname, '/migrations/**/*{.ts,.js}')],
  entities: [join(__dirname, '/entities/**/*{.ts,.js}')],
};

const configSeeder = {
  seeders: ['./libs/database/src/lib/seeders/*.ts'],
  defaultSeeder: 'RootSeeder',
};

export { config, configSeeder };

export default new DataSource({ ...config, ...configSeeder });
