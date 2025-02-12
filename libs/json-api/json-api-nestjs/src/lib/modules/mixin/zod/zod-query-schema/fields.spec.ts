import { zodFieldsQuery } from './fields';
import { Users } from '../../../../mock-utils/typeorm';

import {
  userFields,
  userRelations,
} from '../../../../utils/___test___/test.helper';

const schema = zodFieldsQuery<Users>(userFields, userRelations);
describe('zodFieldsQuerySchema', () => {
  it('should validate a target field correctly', () => {
    const input = { target: ['id'] };
    const result = schema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should validate a nested relation field correctly', () => {
    const input = { roles: ['isDefault', 'key'] };
    const result = schema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should fail validation if input is empty', () => {
    const input = {};
    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Validation error: Select target or relation fields'
      );
    }
  });

  it('should fail validation if an invalid target field is provided', () => {
    const input = { target: 'invalid_field' };
    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Expected array');
    }
  });

  it('should fail validation if the relation object contains incorrect fields', () => {
    const input = { posts: { invalidField: 'value' } };
    const result = schema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should ensure the schema is strict and does not allow extra fields', () => {
    const input = { target: ['id'], extraField: 'not_allowed' };
    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        'Should be only target of relation'
      );
    }
  });

  it('should ensure the schema is strict and does not allow extra fields', () => {
    const input = { target: ['id', 'id'] };
    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        'Field should be unique'
      );
    }
  });

  it('should ensure the schema is strict and does not allow extra fields', () => {
    const input = { target1: ['id', 'id'] };
    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        'Should be only target of relation'
      );
    }
  });

  it('should ensure the schema is strict and does not allow extra fields', () => {
    const input = {};
    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        'Validation error: Select target or relation fields'
      );
    }
  });
  it('should ensure the schema is strict and does not allow extra fields', () => {
    const input: [] = [];
    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Expected object');
    }
  });
  it('should ensure the schema is strict and does not allow extra fields', () => {
    const input = null;
    const result = schema.safeParse(input);
    expect(result.success).toBe(true);
  });
  it('should ensure the schema is strict and does not allow extra fields', () => {
    const input = '';
    const result = schema.safeParse(input);
    expect.assertions(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Expected object');
    }
  });
});
