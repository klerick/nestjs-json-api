import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmLoggerService } from './type-orm-logger.service';
import { config } from './config';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Module({})
export class TypeOrmDatabaseModule {
  static forRoot(): DynamicModule {
    const typeOrmModule = TypeOrmModule.forRootAsync({
      name: 'default',
      useFactory: (typeOrmLoggerService: TypeOrmLoggerService) => ({
        ...config,
        logger: typeOrmLoggerService,
      }),
      inject: [TypeOrmLoggerService],
      extraProviders: [TypeOrmLoggerService],
    });

    return {
      module: TypeOrmDatabaseModule,
      imports: [typeOrmModule],
      exports: [typeOrmModule],
    };
  }
  static forFeature(entities: EntityClassOrSchema[] = []): DynamicModule {
    const { providers, exports } = TypeOrmModule.forFeature(
      entities,
      'default'
    );
    return {
      module: TypeOrmDatabaseModule,
      providers,
      exports,
    };
  }
}
