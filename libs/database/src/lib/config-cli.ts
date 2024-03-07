import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import * as process from 'process';

const config: DataSourceOptions = {
  type: process.env['DB_TYPE'] as 'mysql' | 'postgres',
  host: process.env['DB_HOST'],
  port: parseInt(`${process.env['DB_PORT']}`, 10),
  username: process.env['DB_USERNAME'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_NAME'],
  logging: process.env['DB_LOGGING'] === '1',
  migrations: [join(__dirname, '/migrations/**/*{.ts,.js}')],
  entities: [join(__dirname, '/entities/**/*{.ts,.js}')],
  ...(process.env['DB_TYPE'] === 'mysql' ? { connectorPackage: 'mysql2' } : {}),
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
