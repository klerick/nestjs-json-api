import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicModule } from '@nestjs/common';
import { IMemoryDb } from 'pg-mem';

import {
  Addresses,
  Comments,
  Notes,
  Pods,
  Requests,
  RequestsHavePodLocks,
  Roles,
  UserGroups,
  Users,
} from './entities';
import { DataSource } from 'typeorm';

export * from './entities';
export * from './utils';

export const entities = [
  Users,
  UserGroups,
  Roles,
  RequestsHavePodLocks,
  Requests,
  Pods,
  Comments,
  Addresses,
  Notes,
];

export function mockDBTestModule(db: IMemoryDb): DynamicModule {
  return TypeOrmModule.forRootAsync({
    useFactory() {
      return {
        type: 'postgres',
        // logging: true,
        entities: [
          Users,
          UserGroups,
          Roles,
          RequestsHavePodLocks,
          Requests,
          Pods,
          Comments,
          Addresses,
          Notes,
        ],
      };
    },
    async dataSourceFactory(options) {
      const dataSource: DataSource = await db.adapters.createTypeormDataSource(
        options
      );

      return dataSource;
    },
  });
}
