import { getEntityName, nameIt } from './';

describe('Test utils', () => {
  it('getEntityName', () => {
    expect(getEntityName('Entity')).toBe('Entity');
    expect(getEntityName(class EntityClass {})).toBe('EntityClass');
    class EntityClassInst {}
    const tmp = new EntityClassInst();
    expect(getEntityName(tmp as any)).toBe('EntityClassInst');
  });

  it('nameIt', () => {
    const newNameClass = 'newNameClass';
    const newClass = nameIt(newNameClass, class {});
    expect(getEntityName(newClass)).toBe(newNameClass);
  });
});
