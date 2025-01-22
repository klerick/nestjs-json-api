import { Module } from '@nestjs/common';
import { JsonApiModule, TypeOrmModule } from '@klerick/json-api-nestjs';
import { Users, Addresses, Comments, Roles, BookList } from 'database';
import { ExtendBookListController } from './controllers/extend-book-list/extend-book-list.controller';
import { ExtendUserController } from './controllers/extend-user/extend-user.controller';
import { ExampleService } from './service/example.service';

@Module({
  imports: [
    JsonApiModule.forRoot({
      entities: [Users, Addresses, Comments, Roles, BookList],
      controllers: [ExtendBookListController, ExtendUserController],
      providers: [ExampleService],
      type: TypeOrmModule,
      options: {
        debug: true,
        requiredSelectField: false,
        operationUrl: 'operation',
      },
    }),
  ],
})
export class ResourcesModule {}
