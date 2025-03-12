import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroOrmCoreModule } from '@mikro-orm/nestjs/mikro-orm-core.module';

import { config } from './config';

@Module({
  imports: [MikroOrmModule.forRoot(config), MikroOrmModule.forMiddleware()],
  exports: [MikroOrmCoreModule],
})
export class MicroOrmDatabaseModule {}

export { config };
