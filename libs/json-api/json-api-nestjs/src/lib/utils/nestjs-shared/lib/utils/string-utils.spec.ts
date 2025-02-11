import {
  camelToKebab,
  snakeToCamel,
  isString,
  kebabToCamel,
} from './string-utils';

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
    const result2 = snakeToCamel('testTest');
    const result3 = snakeToCamel('event_incident_typeFK');
    expect(result).toBe('testTest');
    expect(result1).toBe('testTest');
    expect(result2).toBe('testTest');
    expect(result3).toBe('eventIncidentTypeFK');
  });

  it('isString', () => {
    expect(isString('string')).toBe(true);
    expect(isString(String('string'))).toBe(true);
    expect(isString(new Date())).toBe(false);
    expect(isString(class {})).toBe(false);
  });

  it('kebabToCamel', () => {
    const type = 'users-group';
    const type1 = 'users';

    expect(kebabToCamel(type)).toBe('UsersGroup');
    expect(kebabToCamel(type1)).toBe('Users');
  });
});
