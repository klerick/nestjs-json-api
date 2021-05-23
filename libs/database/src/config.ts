import { join } from "path";

const config = {
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "password",
  database: "example",
  migrations: [join(__dirname, '/migrations/**/*{.ts,.js}')],
  entities: [join(__dirname, '/entities/**/*{.ts,.js}')],
  factories: [join(__dirname, '/seed-factories/**/*{.ts,.js}')],
  seeds: [join(__dirname, '/seeds/**/*{.ts,.js}')],
  cli: {
    entitiesDir: "apps/example/src/database/entities",
    migrationsDir: "apps/example/src/database/migrations"
  }
};

export default config;
