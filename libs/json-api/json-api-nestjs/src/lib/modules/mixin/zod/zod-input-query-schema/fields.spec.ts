import { zodFieldsInputQuery } from './fields';
import { ResultGetField } from '../../types';
import { Users } from '../../../../mock-utils/typeorm';

import { userFieldsStructure } from '../../../../utils/___test___/test.helper';

const validRelationList: ResultGetField<Users>['relations'] =
  userFieldsStructure['relations'];

describe('zodFieldsInputQuerySchema', () => {
  const schema = zodFieldsInputQuery<Users>(validRelationList);

  it('should validate successfully with a valid target and relation', () => {
    const targetInput = 'field1,field2';
    const commentsInput = 'text,createdAt';
    const input = {
      target: targetInput,
      roles: '',
      comments: commentsInput,
    };
    const result = schema.safeParse(input);
    expect.assertions(4);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('target', targetInput.split(','));
      expect(result.data).toHaveProperty('comments', commentsInput.split(','));
      expect(result.data).not.toHaveProperty('roles');
    }
  });

  it('should be null result', () => {
    const input = {
      target: '',
    };
    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(null);
    }
  });

  it('should throw error if target is missing', () => {
    const input = {
      posts: ['content'],
    };

    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        'Validation error: Fields should be have only props'
      );
    }
  });

  it('Not allow null', () => {
    const input = {
      target: 'inputString',
      comments: null,
    };

    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        'Expected string, received null'
      );
    }
  });

  it('should return null if all fields in input are empty or null', () => {
    const input = {
      target: undefined,
    };

    expect(schema.parse(input)).toBeNull();
  });

  it('should throw error if additional fields are present in the input', () => {
    const input = {
      target: null,
      notes: false,
      comments: 1,
      addresses: ['invalidValue'], // Invalid field
    };

    const result = schema.safeParse(input);
    expect.assertions(5);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        'Expected string, received null'
      );
      expect(result.error.issues[1].message).toContain(
        'Expected string, received boolean'
      );
      expect(result.error.issues[2].message).toContain(
        'Expected string, received number'
      );
      expect(result.error.issues[3].message).toContain(
        'Expected string, received array'
      );
    }
  });
});
