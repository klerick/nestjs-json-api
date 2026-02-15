import { zodPostRelationship } from './index';
import { ZodError } from 'zod';

describe('zodPostRelationship', () => {
  const schema = zodPostRelationship;

  it('should validate an object with a single valid data item', () => {
    const validData = { data: { id: '1', type: 'example' } };
    expect(() => schema.parse(validData)).not.toThrow();
  });

  it('should validate an object with a non-empty array of valid data items', () => {
    const validData = {
      data: [
        { id: '1', type: 'example1' },
        { id: '2', type: 'example2' },
      ],
    };
    expect(() => schema.parse(validData)).not.toThrow();
  });

  it('should throw an error when data is an empty array', () => {
    const invalidData = { data: [] };
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it('should throw an error when data is null', () => {
    const invalidData = { data: null };
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it('should throw an error when data is missing', () => {
    const invalidData = {};
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it('should throw an error when additional properties are included', () => {
    const invalidData = {
      data: { id: '1', type: 'example' },
      extra: 'invalid',
    };
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it('should accept valid meta object with single data item', () => {
    const validData = {
      data: { id: '1', type: 'example' },
      meta: {
        addedBy: 'admin',
        source: 'import',
      },
    };
    const result = schema.parse(validData);
    expect(result.meta).toEqual({
      addedBy: 'admin',
      source: 'import',
    });
  });

  it('should accept valid meta object with array of data items', () => {
    const validData = {
      data: [
        { id: '1', type: 'example1' },
        { id: '2', type: 'example2' },
      ],
      meta: {
        batchId: '123',
        priority: 'high',
      },
    };
    const result = schema.parse(validData);
    expect(result.meta).toEqual({
      batchId: '123',
      priority: 'high',
    });
  });

  it('should accept empty meta object', () => {
    const validData = {
      data: { id: '1', type: 'example' },
      meta: {},
    };
    const result = schema.parse(validData);
    expect(result.meta).toEqual({});
  });

  it('should work without meta (backward compatibility)', () => {
    const validData = {
      data: { id: '1', type: 'example' },
    };
    const result = schema.parse(validData);
    expect(result.meta).toBeUndefined();
  });

  it('should reject invalid meta (not an object)', () => {
    const invalidMeta = [
      { data: { id: '1', type: 'example' }, meta: 'string' },
      { data: { id: '1', type: 'example' }, meta: 123 },
      { data: { id: '1', type: 'example' }, meta: ['array'] },
      { data: { id: '1', type: 'example' }, meta: null },
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
