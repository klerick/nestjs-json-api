import { Module } from '@nestjs/common';
import { TypeOrmDatabaseModule } from '@nestjs-json-api/typeorm-database';

import { AclModule } from './acl/acl.module';
import { ResourcesTypeModule } from './type-orm/resources-type.module';


@Module({
  imports: [
    TypeOrmDatabaseModule.forRoot(),
    AclModule,
    ResourcesTypeModule
  ],
})
export class JsonApiTypeOrm {}
