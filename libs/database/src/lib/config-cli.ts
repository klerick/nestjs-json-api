import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

const config: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'json-api-db',
  logging: true,
  migrations: [join(__dirname, '/migrations/**/*{.ts,.js}')],
  entities: [join(__dirname, '/entities/**/*{.ts,.js}')],
};
// const config: DataSourceOptions = {
//   type: 'mysql',
//   host: 'localhost',
//   username: 'root',
//   connectorPackage: 'mysql2',
//   password: 'password',
//   database: 'example_new',
//   logging: true,
//   migrations: [join(__dirname, '/migrations/**/*{.ts,.js}')],
//   entities: [join(__dirname, '/entities/**/*{.ts,.js}')],
// };

const configSeeder = {
  seeders: ['./libs/database/src/lib/seeders/*.ts'],
  defaultSeeder: 'RootSeeder',
};

export { config, configSeeder };

export default new DataSource({ ...config, ...configSeeder });
