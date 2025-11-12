import { describe, it, expect } from 'vitest';
import { unsetDeep } from './unset-deep';

describe('unsetDeep', () => {
  it('should remove simple property', () => {
    const obj = { a: 1, b: 2 };
    unsetDeep(obj, 'a');

    expect(obj).toEqual({ b: 2 });
    expect(obj.a).toBeUndefined();
  });

  it('should remove nested property', () => {
    const obj = { a: { b: { c: 1 } } };
    unsetDeep(obj, 'a.b.c');

    expect(obj).toEqual({ a: { b: {} } });
  });

  it('should remove deeply nested property', () => {
    const obj = {
      user: {
        profile: {
          address: {
            city: 'New York',
            street: 'Main St',
          },
        },
      },
    };

    unsetDeep(obj, 'user.profile.address.street');

    expect(obj).toEqual({
      user: {
        profile: {
          address: {
            city: 'New York',
          },
        },
      },
    });
  });

  it('should do nothing if path does not exist', () => {
    const obj = { a: { b: 1 } };
    const original = JSON.parse(JSON.stringify(obj));

    unsetDeep(obj, 'a.c.d');

    expect(obj).toEqual(original);
  });

  it('should do nothing if intermediate path is null', () => {
    const obj = { a: null, b: 2 } as any;
    const original = JSON.parse(JSON.stringify(obj));

    unsetDeep(obj, 'a.b.c');

    expect(obj).toEqual(original);
  });

  it('should do nothing if intermediate path is undefined', () => {
    const obj = { a: undefined, b: 2 } as any;
    const original = JSON.parse(JSON.stringify(obj));

    unsetDeep(obj, 'a.b.c');

    expect(obj).toEqual(original);
  });

  it('should do nothing if intermediate path is primitive', () => {
    const obj = { a: 'string', b: 2 } as any;
    const original = JSON.parse(JSON.stringify(obj));

    unsetDeep(obj, 'a.b.c');

    expect(obj).toEqual(original);
  });

  it('should handle empty path', () => {
    const obj = { a: 1 };
    const original = JSON.parse(JSON.stringify(obj));

    unsetDeep(obj, '');

    expect(obj).toEqual(original);
  });

  it('should do nothing if obj is null', () => {
    expect(() => unsetDeep(null as any, 'a.b')).not.toThrow();
  });

  it('should do nothing if obj is undefined', () => {
    expect(() => unsetDeep(undefined as any, 'a.b')).not.toThrow();
  });

  it('should do nothing if obj is not an object', () => {
    expect(() => unsetDeep('string' as any, 'a.b')).not.toThrow();
    expect(() => unsetDeep(123 as any, 'a.b')).not.toThrow();
  });
});