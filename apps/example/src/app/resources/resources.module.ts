import { Module } from '@nestjs/common';
import { JsonApiModule } from 'json-api-nestjs';
import { Users, Addresses, Comments, Roles } from 'database';

import { ExtendUserController } from './controllers/extend-user/extend-user.controller';
import { ExampleService } from './service/example/example.service';

@Module({
  imports: [
    JsonApiModule.forRoot({
      entities: [Users, Addresses, Comments, Roles],
      controllers: [ExtendUserController],
      providers: [ExampleService],
      options: {
        debug: true,
        maxExecutionTime: 3000,
        requiredSelectField: false,
      },
    }),
  ],
})
export class ResourcesModule {}
