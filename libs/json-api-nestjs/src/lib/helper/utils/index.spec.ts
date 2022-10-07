import {
  camelToKebab,
  snakeToCamel,
  isString,
  getEntityName,
  nameIt,
} from './';

describe('Test utils', () => {
  it('camelToKebab', () => {
    const result = camelToKebab('ApproverGroups');
    const result1 = camelToKebab('Users');

    expect(result).toBe('approver-groups');
    expect(result1).toBe('users');
  });

  it('snakeToCamel', () => {
    const result = snakeToCamel('test_test');
    const result1 = snakeToCamel('test-test');

    expect(result).toBe('testTest');
    expect(result1).toBe('testTest');
  });

  it('isString', () => {
    expect(isString('string')).toBe(true);
    expect(isString(String('string'))).toBe(true);
    expect(isString(new Date())).toBe(false);
    expect(isString(class {})).toBe(false);
  });

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
