import { Global, Module, OnModuleInit } from '@nestjs/common';
import { AclPermissionsModule } from '@klerick/acl-json-api-nestjs';
import { ClsService } from 'nestjs-cls';
import { RulesLoaderService } from './rules-loader.service';

import {
  ContextTestAcl,
  MicroOrmDatabaseModule,
} from '@nestjs-json-api/microorm-database';

@Module({
  imports: [
    AclPermissionsModule.forRoot({
      rulesLoader: RulesLoaderService,
      contextStore: ClsService,
      onNoRules: 'allow',
    }),
    MicroOrmDatabaseModule.forFeature([ContextTestAcl], 'default'),
  ],
  providers: [RulesLoaderService],
})
export class AclModule {}
