import { FactoryProvider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CURRENT_DATA_SOURCE_TOKEN } from '../constants';
import { getDataSourceToken } from '@nestjs/typeorm';

export function CurrentDataSourceProvider(
  connectionName?: string
): FactoryProvider<DataSource> {
  return {
    provide: CURRENT_DATA_SOURCE_TOKEN,
    useFactory: (dataSource: DataSource) => dataSource,
    inject: [getDataSourceToken(connectionName)],
  };
}
