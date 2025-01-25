import { Module } from '@nestjs/common';
import {
  JsonApiModule,
  MicroOrmJsonApiModule,
  TypeOrmJsonApiModule,
} from '@klerick/json-api-nestjs';
import {
  Users,
  Addresses,
  Comments,
  Roles,
  BookList,
} from '@nestjs-json-api/typeorm-database';

import {
  Users as mkUsers,
  Addresses as mkAddresses,
  Comments as mkComments,
  Roles as mkRoles,
  BookList as mkBookList,
} from '@nestjs-json-api/microorm-database';

import { ExtendBookListController } from './controllers/extend-book-list/extend-book-list.controller';
import { ExtendUserController } from './controllers/extend-user/extend-user.controller';
import { ExampleService } from './service/example.service';

const typeOrm = () =>
  JsonApiModule.forRoot(TypeOrmJsonApiModule, {
    entities: [Users, Addresses, Comments, Roles, BookList],
    controllers: [ExtendBookListController, ExtendUserController],
    providers: [ExampleService],
    options: {
      debug: true,
      requiredSelectField: false,
      operationUrl: 'operation',
    },
  });

const microOrm = () =>
  JsonApiModule.forRoot(MicroOrmJsonApiModule, {
    entities: [mkUsers, mkAddresses, mkComments, mkRoles, mkBookList],
    controllers: [ExtendBookListController, ExtendUserController],
    providers: [ExampleService],
    options: {
      debug: true,
      requiredSelectField: false,
      operationUrl: 'operation',
    },
  });

const ormModule = process.env['ORM_TYPE'] === 'typeorm' ? typeOrm : microOrm;

@Module({
  imports: [ormModule()],
})
export class ResourcesModule {}
