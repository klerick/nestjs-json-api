import { Module } from '@nestjs/common';
import { MicroOrmDatabaseModule } from '@nestjs-json-api/microorm-database';

import { AclModule } from './acl/acl.module';
import { ResourcesMicroModule } from './micro-orm/resources-micro.module';

@Module({
  imports: [MicroOrmDatabaseModule.forRoot(), AclModule, ResourcesMicroModule],
})
export class JsonApiMicroOrm {}
