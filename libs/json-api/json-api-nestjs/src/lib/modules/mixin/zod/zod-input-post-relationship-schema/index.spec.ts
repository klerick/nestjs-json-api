import { zodPostRelationship } from './index';

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
});
