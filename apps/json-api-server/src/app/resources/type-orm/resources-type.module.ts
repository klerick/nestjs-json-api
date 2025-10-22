import { Injectable, Module } from '@nestjs/common';
import { JsonApiModule } from '@klerick/json-api-nestjs';
import { TypeOrmJsonApiModule } from '@klerick/json-api-nestjs-typeorm';
import {
  Users,
  Addresses,
  Comments,
  Roles,
  BookList,
} from '@nestjs-json-api/typeorm-database';

import { ExtendBookListController } from './controllers/extend-book-list/extend-book-list.controller';
import { ExtendUserController } from './controllers/extend-user/extend-user.controller';
import { ExampleService } from './service/example.service';
import {
  AclAction,
  AclPermissionsModule,
  AclRule,
  AclRulesLoader,
  wrapperJsonApiController,
} from '@klerick/acl-json-api-nestjs';
import {
  AnyEntity,
  EntityClass,
} from 'dist/libs/json-api/json-api-nestjs-shared/cjs/src';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    JsonApiModule.forRoot(TypeOrmJsonApiModule, {
      entities: [Users, Addresses, Comments, Roles, BookList],
      controllers: [ExtendBookListController, ExtendUserController],
      providers: [ExampleService],
      options: {
        debug: true,
        requiredSelectField: false,
        operationUrl: 'operation',
      },
      // hooks: {
      //   afterCreateController: wrapperJsonApiController
      // }
    }),
  ],
})
export class ResourcesTypeModule {}
