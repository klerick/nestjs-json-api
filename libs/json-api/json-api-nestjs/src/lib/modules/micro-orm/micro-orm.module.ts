import { NestProvider, ResultModuleOptions, ObjectLiteral } from '../../types';
import { DynamicModule } from '@nestjs/common';

export class MicroOrmModule {
  static forRoot(options: ResultModuleOptions): DynamicModule {
    return {
      module: MicroOrmModule,
    };
  }

  static getUtilProviders(entity: ObjectLiteral): NestProvider {
    return [];
  }
}
