import { Module, Type } from '@nestjs/common';
import { JsonApiModule } from '@klerick/json-api-nestjs';
import { TypeOrmJsonApiModule } from '@klerick/json-api-nestjs-typeorm';
import {
  Users,
  Addresses,
  Comments,
  Roles,
  BookList,
  UsersAcl,
  ArticleAcl,
  CategoryAcl,
  TagAcl,
  PostAcl,
  CommentAcl,
  DocumentAcl,
  UserProfileAcl,
  ContextTestAcl,
} from '@nestjs-json-api/typeorm-database';

import { ExtendBookListController } from './controllers/extend-book-list/extend-book-list.controller';
import { ExtendUserController } from './controllers/extend-user/extend-user.controller';
import { CommentsController } from './controllers/comments/comments.controller'
import { ExampleService } from './service/example.service';
import { wrapperJsonApiController } from '@klerick/acl-json-api-nestjs';

@Module({
  imports: [
    JsonApiModule.forRoot(TypeOrmJsonApiModule, {
      entities: [
        Users,
        Addresses,
        Comments,
        Roles,
        BookList,
        UsersAcl,
        ArticleAcl,
        CategoryAcl,
        TagAcl,
        PostAcl,
        CommentAcl,
        DocumentAcl,
        UserProfileAcl,
        ContextTestAcl,
      ],
      controllers: [
        ExtendBookListController,
        ExtendUserController,
        CommentsController,
      ],
      providers: [ExampleService],
      options: {
        debug: true,
        requiredSelectField: false,
        operationUrl: 'operation',
      },
      hooks: {
        afterCreateController: (controllerClass: Type<any>) => {
          if (
            !controllerClass.name.startsWith('ContextTestAcl') &&
            controllerClass.name.indexOf('Acl') > -1
          ) {
            wrapperJsonApiController(controllerClass);
          }
        },
      },
    }),
  ],
})
export class ResourcesTypeModule {}
