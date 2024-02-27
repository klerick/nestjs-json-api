import { zodIncludeQuerySchema } from './include';
import { ZodError } from 'zod';

describe('Check "include" zod schema', () => {
  const relations = [
    'userGroup',
    'notes',
    'comments',
    'roles',
    'manager',
    'addresses',
  ] as const;
  const zodIncludeQuerySchemaResult = zodIncludeQuerySchema(relations);

  it('Valid schema', () => {
    const check1 = ['addresses'];
    const result1 = zodIncludeQuerySchemaResult.parse(check1);
    expect(result1).toEqual(check1);

    const check2 = ['addresses', 'manager'];
    const result2 = zodIncludeQuerySchemaResult.parse(check2);
    expect(result2).toEqual(check2);
  });

  it('Invalid schema', () => {
    const check1: string[] = [];
    const check2: string[] = ['test'];
    const check3: string[] = ['addresses', 'manager', 'manager'];

    const checkArray = [check1, check2, check3];
    expect.assertions(checkArray.length);
    for (const check of checkArray) {
      try {
        zodIncludeQuerySchemaResult.parse(check);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});
