import { zodPatchRelationship } from './index';

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
});
