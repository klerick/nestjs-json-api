import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import {DatabaseModule} from 'database';
import {ResourcesModule} from './resources/resources.module';


@Module({
  imports: [
    DatabaseModule,
    ResourcesModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'debug'
      }
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
