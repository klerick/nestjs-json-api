import { Module } from '@nestjs/common';
import {JsonApiModule} from 'json-api-nestjs';
import {Users, Addresses, Comments, Roles} from 'database';

import {ExtendUserController} from './controllers/extend-user/extend-user.controller';

@Module({
  imports: [
    JsonApiModule.forRoot({
      entities: [
        Users,
        // Addresses,
        // Comments,
        // Roles
      ],
      controllers: [
        ExtendUserController
      ],
      options: {
        debug: true,
        maxExecutionTime: 3000,
        requiredSelectField: false
      }
    })
  ]
})
export class ResourcesModule {}
