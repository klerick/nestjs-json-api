import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { pgConfig } from './config-db';

export const config: TypeOrmModuleOptions = pgConfig;
