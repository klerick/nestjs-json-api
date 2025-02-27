import { getEntityName } from './object-utils';

describe('object utils', () => {
  it('getEntityName', () => {
    expect(getEntityName('Entity')).toBe('Entity');
    expect(getEntityName(class EntityClass {})).toBe('EntityClass');
    class EntityClassInst {}
    const tmp = new EntityClassInst();
    expect(getEntityName(tmp as any)).toBe('EntityClassInst');
  });
});
