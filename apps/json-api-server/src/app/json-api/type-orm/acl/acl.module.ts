import { Module } from '@nestjs/common';
import { AclPermissionsModule } from '@klerick/acl-json-api-nestjs';
import { ClsService } from 'nestjs-cls';
import { RulesLoaderService } from './rules-loader.service';

import {
  ContextTestAcl,
  TypeOrmDatabaseModule
} from '@nestjs-json-api/typeorm-database';

@Module({
  imports: [
    AclPermissionsModule.forRoot({
      rulesLoader: RulesLoaderService,
      contextStore: ClsService,
      onNoRules: 'allow',
    }),
    TypeOrmDatabaseModule.forFeature([ContextTestAcl]),
  ],
  providers: [RulesLoaderService],
})
export class AclModule {}
