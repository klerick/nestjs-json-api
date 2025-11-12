import { DataSource } from 'typeorm';

import { join } from 'node:path';
import { pgConfig } from './config-db';

export default new DataSource({
  ...pgConfig,
  migrations: [join(__dirname, '/migrations-pg/**/*{.ts,.js}')],
});
