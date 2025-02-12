import { Module } from '@nestjs/common';
import { JsonApiModule, TypeOrmJsonApiModule } from '@klerick/json-api-nestjs';
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
    }),
  ],
})
export class ResourcesTypeModule {}
