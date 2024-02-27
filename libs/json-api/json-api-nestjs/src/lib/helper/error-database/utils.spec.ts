import { formErrorString } from './utils';

const metadata = {
  tableName: 'users',
  name: 'Users',
  columns: [
    {
      databaseName: 'created_at',
      propertyName: 'createdAt',
    },
    {
      databaseName: 'addresses_id',
      propertyName: 'addresses',
    },
  ],
} as any;

describe('utils', () => {
  it('formErrorString', () => {
    const result = formErrorString(
      metadata,
      `null value in column "${metadata.columns[1].propertyName}" of relation "${metadata.tableName}" violates not-null constraint`
    );
    expect(result).toBe(
      `null value in column "${metadata.columns[1].propertyName}" of relation "${metadata.name}" violates not-null constraint`
    );
  });
});
