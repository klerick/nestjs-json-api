import { Module } from '@nestjs/common';

import {DatabaseModule} from 'database';
import {ResourcesModule} from './resources/resources.module';


@Module({
  imports: [
    DatabaseModule,
    ResourcesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
