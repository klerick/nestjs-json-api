import { Module, Type } from '@nestjs/common';
import { JsonApiModule } from '@klerick/json-api-nestjs';
import { MicroOrmJsonApiModule } from '@klerick/json-api-nestjs-microorm';
import {
  Users,
  Addresses,
  Comments,
  Roles,
  BookList,
} from '@nestjs-json-api/microorm-database';

import {
  UsersAcl,
  ArticleAcl,
  CategoryAcl,
  TagAcl,
  PostAcl,
  CommentAcl,
  DocumentAcl,
  UserProfileAcl,
  ContextTestAcl,
} from '@nestjs-json-api/microorm-database';

const GeneraleResource = [
  Users,
  Addresses,
  Comments,
  Roles,
  BookList,
  ContextTestAcl,
];
const AclResource = [
  UsersAcl,
  ArticleAcl,
  CategoryAcl,
  TagAcl,
  PostAcl,
  CommentAcl,
  DocumentAcl,
  UserProfileAcl,
];

import { ExtendBookListController } from './controllers/extend-book-list/extend-book-list.controller';
import { ExtendUserController } from './controllers/extend-user/extend-user.controller';
import { ExampleService } from './service/example.service';

import { wrapperJsonApiController } from '@klerick/acl-json-api-nestjs';
import { CommentsController } from './controllers/comments/comments.controller';

@Module({
  imports: [
    JsonApiModule.forRoot(MicroOrmJsonApiModule, {
      entities: [...GeneraleResource, ...AclResource] as any,
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
export class ResourcesMicroModule {}
