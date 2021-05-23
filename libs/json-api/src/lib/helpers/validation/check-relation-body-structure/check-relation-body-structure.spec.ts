import { checkRelationBodyStructure } from './check-relation-body-structure';


describe('CheckRelationBodyStructure', () => {
  it('should return error if data not exist', async () => {
    const result = await checkRelationBodyStructure(undefined);
    expect(result[0].source.pointer).toBe('');
    expect(result[0].detail).toContain("'data'");
    expect(result).toHaveLength(1);
  });

  it('should return no errors if data exists', async () => {
    const result = await checkRelationBodyStructure({
      type: 'type',
      id: '1'
    });
    expect(result).toHaveLength(0);
  });

  it('should return no errors if is nullable', async () => {
    const result = await checkRelationBodyStructure(null, true);
    expect(result).toHaveLength(0);
  });
});
