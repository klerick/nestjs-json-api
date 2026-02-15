import { zodPatchRelationship } from './index';
import { ZodError } from 'zod';

describe('zodPatchRelationship', () => {
  const schema = zodPatchRelationship;

  it('should validate an object with nullable data matching zodData', () => {
    const validData = { data: { id: '123', type: 'example' } };

    expect(() => schema.parse(validData)).not.toThrow();
  });

  it('should validate an object with null as the value of data', () => {
    const validData = { data: null };

    expect(() => schema.parse(validData)).not.toThrow();
  });

  it('should validate an object with empty array as the value of data', () => {
    const validData = { data: [] };

    expect(() => schema.parse(validData)).not.toThrow();
  });

  it('should validate an object with an array of objects matching zodData', () => {
    const validData = {
      data: [
        { id: '123', type: 'example' },
        { id: '456', type: 'example2' },
      ],
    };
    expect(() => schema.parse(validData)).not.toThrow();
  });

  it('should throw an error for extra unknown properties', () => {
    const invalidData = {
      data: { id: '123', type: 'example' },
      extra: 'invalid',
    };

    expect(() => schema.parse(invalidData)).toThrow();
  });

  it('should accept valid meta object with single data', () => {
    const validData = {
      data: { id: '123', type: 'example' },
      meta: {
        updatedBy: 'admin',
        reason: 'sync',
      },
    };
    const result = schema.parse(validData);
    expect(result.meta).toEqual({
      updatedBy: 'admin',
      reason: 'sync',
    });
  });

  it('should accept valid meta object with null data', () => {
    const validData = {
      data: null,
      meta: {
        clearedBy: 'admin',
      },
    };
    const result = schema.parse(validData);
    expect(result.meta).toEqual({
      clearedBy: 'admin',
    });
  });

  it('should accept valid meta object with array of data', () => {
    const validData = {
      data: [
        { id: '123', type: 'example' },
        { id: '456', type: 'example2' },
      ],
      meta: {
        batchUpdate: true,
        timestamp: Date.now(),
      },
    };
    const result = schema.parse(validData);
    expect(result.meta).toEqual({
      batchUpdate: true,
      timestamp: expect.any(Number),
    });
  });

  it('should accept empty meta object', () => {
    const validData = {
      data: { id: '123', type: 'example' },
      meta: {},
    };
    const result = schema.parse(validData);
    expect(result.meta).toEqual({});
  });

  it('should work without meta (backward compatibility)', () => {
    const validData = {
      data: { id: '123', type: 'example' },
    };
    const result = schema.parse(validData);
    expect(result.meta).toBeUndefined();
  });

  it('should reject invalid meta (not an object)', () => {
    const invalidMeta = [
      { data: { id: '123', type: 'example' }, meta: 'string' },
      { data: { id: '123', type: 'example' }, meta: 123 },
      { data: { id: '123', type: 'example' }, meta: ['array'] },
      { data: { id: '123', type: 'example' }, meta: null },
    ];

    expect.assertions(invalidMeta.length);
    for (const item of invalidMeta) {
      try {
        schema.parse(item);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});
